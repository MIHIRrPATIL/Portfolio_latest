import json
import re
import httpx
from typing import AsyncGenerator, Dict, Any, List
from app.config import settings
from app.agent.nodes.base import BaseNode
from app.agent.state import MasterAgentState

SYSTEM_PROMPT_TEMPLATE = """You are the AI Persona of Mihir Patil (MIHIRrPATIL) — a Full-Stack AI Engineer, Systems Researcher, and Creative Technologist.
You speak with technical precision, confidence, and editorial conciseness. Avoid robotic filler words or corporate fluff.

Active Client Navigation Context:
- Route Path: {pathname}
- Page / Project Metadata: {page_context}

Shodh Conversational Memory & Prior Turns:
{chat_history}

Episodic Session Context:
{episodic_context}

Ground Truth Knowledge Graph Context:
{graph_context}

Tool Execution Context:
{tool_context}

User Query:
{user_query}

Strict Guidelines:
1. Answer directly and technically using the Ground Truth Knowledge Graph, Active Page Context, Episodic Memory, and Tool Execution Context provided above.
2. If asked about previous topics, visitor name, or past messages in the conversation, reference the Shodh Conversational Memory directly.
3. Base all architectural, technical, algorithm, and implementation details strictly on the Ground Truth Knowledge Graph and real-time read-only GitHub Code Search results.
4. If the user refers to "this", "this project", or "here", anchor your answer to the active page and project dossier they are currently viewing.
5. If on "/graph", assist the user in navigating the 3D or 2D GraphRAG knowledge graph (connecting skills, tools, and repos).
6. If code snippets, files, or inspected GitHub functions are in the tool context, cite them accurately with Markdown syntax formatting.
7. DO NOT output preamble, meta-commentary, safety labels, or tags like "User Safety: safe" or "Safety Categories: PII/Privacy". Begin immediately with the direct technical answer.
8. DO NOT mention internal retrieval scores, confidence ratings, or server benchmark numbers (e.g. "confidence score of 9.18" or "score 90"). Speak naturally about the engineering capabilities, architectures, and outcomes.
9. If asked about collaborating, contacting, or how you will notify/reach Mihir: Explain that when a visitor shares their email and message directly in this chat, the agent automatically captures and records the lead into the database queue to notify Mihir directly. Visitors can also click the Schedule Collaboration Sync button below to jump straight to the contact terminal. DO NOT falsely claim an inquiry has already been dispatched if no contact details were provided.
10. Keep explanations crisp, high-signal, and engaging.
"""

class ResponseSynthesizerNode(BaseNode):
    """
    Synthesizes streaming responses using Hybrid Google Gemini API
    with OpenRouter fallback and offline rule-based generation,
    incorporating live client navigation context, safety filtering, Shodh memory recall, and interactive project dossier action badges.
    """
    name = "response_synthesizer"

    def build_prompt(self, state: MasterAgentState) -> str:
        graph_text = json.dumps(state.graph_context, indent=2) if state.graph_context else "No direct graph matches."
        tool_text = json.dumps([t.model_dump() for t in state.tool_results], indent=2) if state.tool_results else "None."
        page_ctx_text = json.dumps(state.page_context, indent=2) if state.page_context else "Standard View"
        pathname_text = state.pathname or "/"

        history_formatted = []
        for msg in (state.chat_history or []):
            role_label = "Visitor" if msg.role == "user" else "Mihir AI"
            history_formatted.append(f"{role_label}: {msg.content}")
        history_text = "\n".join(history_formatted) if history_formatted else "None (start of session)."
        episodic_text = json.dumps(state.episodic_context, indent=2) if state.episodic_context else "None."

        return SYSTEM_PROMPT_TEMPLATE.format(
            pathname=pathname_text,
            page_context=page_ctx_text,
            chat_history=history_text,
            episodic_context=episodic_text,
            graph_context=graph_text,
            tool_context=tool_text,
            user_query=state.user_query
        )

    def _build_openrouter_messages(self, prompt: str, state: MasterAgentState) -> List[Dict[str, str]]:
        messages = [{"role": "system", "content": prompt}]
        for m in (state.chat_history or [])[-6:]:
            role = "user" if m.role == "user" else "assistant"
            messages.append({"role": role, "content": m.content})
        messages.append({"role": "user", "content": state.user_query})
        return messages

    def _build_gemini_contents(self, prompt: str, state: MasterAgentState) -> List[Dict[str, Any]]:
        contents = [
            {"role": "user", "parts": [{"text": f"System Persona & Instructions:\n{prompt}\n\nPlease follow these instructions strictly."}]},
            {"role": "model", "parts": [{"text": "Understood. I am Mihir's AI Persona, ready to respond with technical precision."}]}
        ]
        for m in (state.chat_history or [])[-6:]:
            role = "user" if m.role == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m.content}]})
        contents.append({"role": "user", "parts": [{"text": state.user_query}]})
        return contents

    def _clean_llm_output(self, text: str) -> str:
        """Strip safety leaks, internal scores, system headers, or meta-comments from free external models."""
        cleaned = text
        # Strip out safety artifacts and classification categories
        cleaned = re.sub(r"^(?:User\s+Safety|Safety\s+Assessment|Safety\s+Check|Safety\s+Categories|Response\s+Safety|Safety|Status):\s*[^\n]+\n*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"(?:Safety\s+Categories|Safety\s+Assessment|User\s+Safety|Response\s+Safety):\s*[^\n]+", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"^\[(?:System\s+Note|Safety|Instruction|Safety\s+Refusal)\].*?\n*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"^(?:Assistant|AI|Mihir):\s*", "", cleaned, flags=re.IGNORECASE)
        # Strip out leaked internal confidence scores
        cleaned = re.sub(r"(?:With a |Based on a |Having a )?confidence score of \d+(?:\.\d+)?(?:,\s*)?", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"(?:,\s*)?with a (?:retrieval |confidence )?score of \d+(?:\.\d+)?", "", cleaned, flags=re.IGNORECASE)
        return cleaned.strip()

    def _generate_ui_badges(self, state: MasterAgentState) -> List[Dict[str, str]]:
        badges = list(state.ui_badges)
        existing_urls = set(b.get("url") for b in badges if b.get("url"))

        special_demos = {
            "reflectos": "https://reflectos.vercel.app",
        }

        # Automatically generate dossier redirect badges for any targeted or mentioned projects
        for repo_id in state.target_repo_ids:
            slug = repo_id.lower().replace("_", "-").strip()
            dossier_url = f"/projects/{slug}"
            
            # Format clean title
            words = slug.replace("-", " ").split()
            acronyms = {"ai", "ui", "api", "db", "ml", "nlp", "llm", "ast", "cli", "sdk", "os", "asr", "sih", "ipd"}
            title = " ".join(w.upper() if w in acronyms else w.capitalize() for w in words)

            if dossier_url not in existing_urls:
                badges.append({
                    "type": "project_dossier",
                    "label": f"Explore {title} Dossier",
                    "url": dossier_url,
                    "project_id": slug
                })
                existing_urls.add(dossier_url)

            if slug in special_demos and special_demos[slug] not in existing_urls:
                demo_url = special_demos[slug]
                badges.append({
                    "type": "live_demo",
                    "label": f"Live Demo: {title}",
                    "url": demo_url
                })
                existing_urls.add(demo_url)

        return badges

    async def execute(self, state: MasterAgentState) -> MasterAgentState:
        prompt = self.build_prompt(state)

        # 1. Primary: Google Gemini 1.5 API
        if settings.GEMINI_API_KEY:
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "contents": self._build_gemini_contents(prompt, state),
                    "generationConfig": {"temperature": 0.3}
                }
                async with httpx.AsyncClient(timeout=25.0) as client:
                    res = await client.post(gemini_url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            raw_text = candidates[0]["content"]["parts"][0]["text"]
                            cleaned = self._clean_llm_output(raw_text)
                            if len(cleaned) > 20 and not cleaned.lower().startswith("safety categories:"):
                                state.final_text = cleaned
                                state.llm_provider = "gemini-1.5-flash"
                                state.ui_badges = self._generate_ui_badges(state)
                                state.suggested_followups = self._generate_followups(state)
                                return state
            except Exception as e:
                print(f"⚠️ [GEMINI ERROR] {str(e)}, falling back to OpenRouter...")

        # 2. Secondary: OpenRouter API Fallback
        if settings.OPENROUTER_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=25.0) as client:
                    headers = {
                        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "Mihir Portfolio AI Copilot"
                    }
                    payload = {
                        "model": settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct:free",
                        "messages": self._build_openrouter_messages(prompt, state),
                        "temperature": 0.3
                    }
                    res = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        raw_text = data["choices"][0]["message"]["content"]
                        cleaned = self._clean_llm_output(raw_text)
                        if len(cleaned) > 20 and not cleaned.lower().startswith("safety categories:"):
                            state.final_text = cleaned
                            state.llm_provider = "openrouter"
                            state.ui_badges = self._generate_ui_badges(state)
                            state.suggested_followups = self._generate_followups(state)
                            return state
            except Exception as e:
                print(f"⚠️ [OPENROUTER ERROR] {str(e)}, falling back to offline rule generator...")

        # 3. Offline Rule-Based Graph & Code Fallback
        raw_text = self._rule_based_response(state)
        state.final_text = self._clean_llm_output(raw_text)
        state.llm_provider = "offline-knowledge-engine"
        state.ui_badges = self._generate_ui_badges(state)
        state.suggested_followups = self._generate_followups(state)
        return state

    async def stream_execute(self, state: MasterAgentState) -> AsyncGenerator[str, None]:
        prompt = self.build_prompt(state)
        initial_buffer = ""
        safety_cleared = False

        # 1. Primary: Google Gemini SSE Streaming
        if settings.GEMINI_API_KEY:
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key={settings.GEMINI_API_KEY}&alt=sse"
                payload = {
                    "contents": self._build_gemini_contents(prompt, state),
                    "generationConfig": {"temperature": 0.3}
                }
                async with httpx.AsyncClient(timeout=35.0) as client:
                    async with client.stream("POST", gemini_url, json=payload) as response:
                        if response.status_code == 200:
                            state.llm_provider = "gemini-1.5-flash"
                            async for line in response.aiter_lines():
                                if line.startswith("data: "):
                                    try:
                                        chunk = json.loads(line[6:].strip())
                                        candidates = chunk.get("candidates", [])
                                        if candidates:
                                            parts = candidates[0].get("content", {}).get("parts", [])
                                            for p in parts:
                                                t = p.get("text", "")
                                                if t:
                                                    state.final_text += t
                                                    if not safety_cleared:
                                                        initial_buffer += t
                                                        if len(initial_buffer) > 40 or "\n\n" in initial_buffer:
                                                            cleaned_buf = self._clean_llm_output(initial_buffer)
                                                            safety_cleared = True
                                                            if cleaned_buf:
                                                                yield cleaned_buf
                                                    else:
                                                        yield t
                                    except Exception:
                                        continue
                            if not safety_cleared and initial_buffer:
                                yield self._clean_llm_output(initial_buffer)
                            state.final_text = self._clean_llm_output(state.final_text)
                            if len(state.final_text) > 20 and not state.final_text.lower().startswith("safety categories:"):
                                state.ui_badges = self._generate_ui_badges(state)
                                state.suggested_followups = self._generate_followups(state)
                                return
            except Exception as e:
                print(f"[GEMINI STREAM ERROR] {str(e)}, falling back to OpenRouter...")

        # 2. Secondary: OpenRouter Streaming
        if settings.OPENROUTER_API_KEY:
            try:
                initial_buffer = ""
                safety_cleared = False
                async with httpx.AsyncClient(timeout=35.0) as client:
                    headers = {
                        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "Mihir Portfolio AI Copilot"
                    }
                    payload = {
                        "model": settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct:free",
                        "messages": self._build_openrouter_messages(prompt, state),
                        "temperature": 0.3,
                        "stream": True
                    }
                    async with client.stream("POST", "https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers) as response:
                        if response.status_code == 200:
                            state.llm_provider = "openrouter"
                            async for line in response.aiter_lines():
                                if line.startswith("data: "):
                                    data_str = line[6:].strip()
                                    if data_str == "[DONE]":
                                        break
                                    try:
                                        chunk = json.loads(data_str)
                                        delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                        if delta:
                                            state.final_text += delta
                                            if not safety_cleared:
                                                initial_buffer += delta
                                                if len(initial_buffer) > 40 or "\n\n" in initial_buffer:
                                                    cleaned_buf = self._clean_llm_output(initial_buffer)
                                                    safety_cleared = True
                                                    if cleaned_buf:
                                                        yield cleaned_buf
                                            else:
                                                yield delta
                                    except Exception:
                                        continue
                            if not safety_cleared and initial_buffer:
                                yield self._clean_llm_output(initial_buffer)
                            state.final_text = self._clean_llm_output(state.final_text)
                            if len(state.final_text) > 20 and not state.final_text.lower().startswith("safety categories:"):
                                state.ui_badges = self._generate_ui_badges(state)
                                state.suggested_followups = self._generate_followups(state)
                                return
            except Exception as e:
                print(f"[OPENROUTER STREAM ERROR] {str(e)}, falling back to offline rule generator...")

        # 3. Fallback to Rule-Based Code & Graph Response
        fallback = self._rule_based_response(state)
        state.final_text = fallback
        state.llm_provider = "offline-knowledge-engine"
        state.ui_badges = self._generate_ui_badges(state)
        state.suggested_followups = self._generate_followups(state)
        
        words = fallback.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i+3]) + (" " if i+3 < len(words) else "")
            yield chunk

    def _rule_based_response(self, state: MasterAgentState) -> str:
        q_low = state.user_query.lower()

        # 1. Check Inspected GitHub Code Tool Results (Read-Only)
        gh_tool_res = next((t for t in state.tool_results if t.tool_name == "search_github_repo"), None)
        if gh_tool_res and gh_tool_res.result.get("inspected_source_file"):
            sf = gh_tool_res.result["inspected_source_file"]
            path = sf.get("path", "file")
            content = sf.get("content", "")
            lines_snippet = "\n".join(content.splitlines()[:25])
            repo_display = state.target_repo_ids[0].replace("-", " ").upper() if state.target_repo_ids else "the active repository"
            return (
                f"Inspected repository source file `{path}` ({repo_display}):\n\n"
                f"```\n{lines_snippet}\n```\n\n"
                f"This file directly defines architecture logic and dependencies for {repo_display}."
            )

        # Check Database Results
        db_tool_res = next((t for t in state.tool_results if t.tool_name == "query_database"), None)
        if db_tool_res and db_tool_res.result.get("rows"):
            rows = db_tool_res.result["rows"]
            lines = ["Here are the queried metrics from the database:\n"]
            for r in rows:
                lines.append(f"- **{r.get('repo_name', r.get('title', 'Entity'))}**: {r.get('grade', r.get('category', 'Active'))}")
            return "\n".join(lines)

        # Check Graph Context
        if state.graph_context:
            top = state.graph_context[0]
            desc = top.get('docstring') or f"Engineering module built with {', '.join(top.get('technologies', []))}."
            sig = f"\n\n```python\n{top.get('signature')}\n```" if top.get('signature') else ""
            calls = f"\n\n**Dependencies**: `{', '.join(top.get('called_functions', []))}`" if top.get('called_functions') else ""
            return f"### {top.get('matched_symbol')} ({top.get('parent_project')})\n\n{desc}{sig}{calls}"

        # Context-aware fallback message
        pathname = (state.pathname or "").lower()
        if pathname.startswith("/projects/"):
            slug = pathname.replace("/projects/", "").strip().replace("-", " ").title()
            return f"You are currently viewing the **{slug}** case study. Mihir engineered this project with strict architectural boundaries, automated pipelines, and modular domain logic."
        elif pathname == "/graph":
            return "You are viewing the **Neural Knowledge Graph**, which models interconnected nodes (repositories, programming languages, neural architectures, and career milestones)."
        
        return "Mihir specializes in Distributed Systems, Speech AI Research (CDAC), Federated Learning (IPD), and Cloud Operating Systems (ReflectOS). Explore the Neural Knowledge Graph or project dossiers on the homepage."

    def _generate_followups(self, state: MasterAgentState) -> List[str]:
        followups = []
        pathname = (state.pathname or "").lower().strip()

        # 1. Dynamic followups from retrieved Graph Nodes (symbols & call chains)
        if state.graph_context:
            top = state.graph_context[0]
            symbol_name = top.get("matched_symbol") or top.get("name")
            parent_proj = top.get("parent_project") or (state.target_repo_ids[0].replace("-", " ").upper() if state.target_repo_ids else "this project")
            called_funcs = top.get("called_functions") or []

            if symbol_name:
                followups.append(f"How is `{symbol_name}` implemented in {parent_proj}?")
            if called_funcs:
                followups.append(f"Explain how `{symbol_name}` calls `{called_funcs[0]}`")
            elif top.get("technologies"):
                tech_list = ", ".join(top["technologies"][:2])
                followups.append(f"How does {parent_proj} utilize {tech_list}?")

        # 2. Dynamic followups from Inspected GitHub Code Tool Results
        gh_tool = next((t for t in state.tool_results if t.tool_name == "search_github_repo"), None)
        if gh_tool and gh_tool.result:
            inspected = gh_tool.result.get("inspected_source_file")
            sample_files = gh_tool.result.get("sample_files", [])
            repo = gh_tool.result.get("repo", "this repository")

            if inspected and inspected.get("path"):
                file_name = inspected["path"].split("/")[-1]
                followups.append(f"Walk through the logic of `{file_name}` in {repo}")
            elif sample_files:
                interesting = [f for f in sample_files if any(f.endswith(ext) for ext in [".py", ".rs", ".ts", ".go", ".tsx", ".cpp"]) and not f.startswith(".")]
                if interesting:
                    file_name = interesting[0].split("/")[-1]
                    followups.append(f"Inspect `{file_name}` in the {repo} repository")

        # 3. Dynamic followups from Target Repository or Active Route
        active_repo = None
        if state.target_repo_ids:
            active_repo = state.target_repo_ids[0]
        elif pathname.startswith("/projects/"):
            active_repo = pathname.replace("/projects/", "").split("/")[0].split("?")[0].strip()

        if active_repo:
            repo_title = active_repo.replace("-", " ").replace("_", " ").title()
            followups.append(f"What are the core technical capabilities of {repo_title}?")
            followups.append(f"Show system architecture and data pipeline for {repo_title}")
            followups.append(f"How can I collaborate with Mihir on {repo_title}?")

        # 4. Route-specific dynamic suggestions
        if pathname == "/graph":
            followups.append("Which repository has the highest node centrality in the Knowledge Graph?")
            followups.append("Show cross-repository technology clusters in the 3D Graph")
            followups.append("Explain the call graph dependencies between services")
        elif pathname == "/projects" or pathname == "/" or not followups:
            # Query dynamic project names from the live Graph Store
            try:
                from app.graph.graph_store import graph_store
                known_repos = [
                    d.get("data", {}).get("name") or n.replace("-", " ").title()
                    for n, d in graph_store.graph.nodes(data=True)
                    if d.get("data", {}).get("type") == "PROJECT"
                ]
                if known_repos:
                    for r in known_repos[:2]:
                        followups.append(f"What is the system architecture of {r}?")
            except Exception:
                pass

        # 5. Add universal high-signal suggestions if needed
        if len(followups) < 3:
            followups.append("What are Mihir's core areas of research and development?")
            followups.append("How can I schedule a technical collaboration sync with Mihir?")
            followups.append("Compare standalone repositories vs distributed systems in the portfolio")

        # Deduplicate while preserving original order, limit to top 3
        seen = set()
        deduped = []
        for f in followups:
            cleaned = f.strip()
            if cleaned and cleaned not in seen:
                seen.add(cleaned)
                deduped.append(cleaned)
            if len(deduped) >= 3:
                break

        return deduped

synth_node = ResponseSynthesizerNode()
