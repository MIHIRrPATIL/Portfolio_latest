import os
from typing import Dict, Any, List
from app.graph.schema import GraphNode, GraphEdge, NodeType, RelationType
from app.graph.ast_parser import CodeASTExtractor
from app.graph.graph_store import graph_store

PROJECT_DOMAINS: Dict[str, str] = {
    "cdac-asr": "ASR & Speech Processing Pipeline",
    "vaultagent": "Autonomous AI Security & Vault Intelligence",
    "reflectos": "Cloud Operating System & Web Desktop",
    "ipd": "Distributed Incremental Federated Learning",
    "hireai": "Enterprise Technical Assessment Platform",
    "niti-ai": "Agentic Legal & Governance Intelligence",
    "greekslab": "High-Frequency Algorithmic Trading & Analytics"
}

# Archetype architectural modules for projects with compact caches
PROJECT_CORE_PIPELINES: Dict[str, List[Dict[str, Any]]] = {
    "cdac-asr": [
        {"file": "models/wav2vec2_ctc.py", "func": "finetune_acoustic_model", "sig": "def finetune_acoustic_model(model_name: str = 'facebook/wav2vec2-base-960h', dataset: str = 'Indic-Speech/LibriSpeech')", "doc": "Fine-tunes self-supervised Wav2Vec2 transformer encoder with CTC (Connectionist Temporal Classification) loss for acoustic phoneme recognition."},
        {"file": "pipeline/phoneme_aligner.py", "func": "align_phonemes_viterbi", "sig": "def align_phonemes_viterbi(emissions: torch.Tensor, transcript: str)", "doc": "Executes dynamic programming Viterbi forced alignment to compute phoneme-level timestamps and pronunciation confidence scores."},
        {"file": "audio/dsp_processor.py", "func": "preprocess_audio_stream", "sig": "def preprocess_audio_stream(waveform: np.ndarray, sample_rate: int = 16000)", "doc": "Applies bandpass filtering, silence trimming, and 16kHz resampling for robust acoustic feature extraction."}
    ],
    "vaultagent": [
        {"file": "src-tauri/src/vault.rs", "func": "decrypt_vault_payload", "sig": "pub fn decrypt_vault_payload(encrypted_blob: &[u8], master_key: &Zeroizing<Key>) -> Result<VaultData>", "doc": "Zero-knowledge hardware-accelerated vault decryption using Argon2id key derivation and XChaCha20-Poly1305."},
        {"file": "core/semantic_search.py", "func": "index_markdown_notes", "sig": "def index_markdown_notes(vault_path: Path, embed_dim: int = 384)", "doc": "Local vector search pipeline indexing Obsidian notes with bi-directional wikilink graph traversal."},
        {"file": "src/components/VaultGraph.tsx", "func": "render_force_graph", "sig": "export const VaultGraph: React.FC<VaultGraphProps>", "doc": "Interactive 3D note visualizer with real-time semantic cluster tagging."}
    ],
    "hireai": [
        {"file": "core/evaluator.ts", "func": "evaluate_candidate", "sig": "async evaluate_candidate(submission: CodePayload)", "doc": "Executes automated runtime evaluation and test suite benchmarks."},
        {"file": "api/interview.ts", "func": "stream_interview_session", "sig": "async stream_interview_session(sessionId: string)", "doc": "Manages real-time WebRTC socket streaming and AI interview agent orchestration."}
    ],
    "greekslab": [
        {"file": "engine/black_scholes.py", "func": "calculate_option_greeks", "sig": "def calculate_option_greeks(spot: float, strike: float, iv: float)", "doc": "Computes real-time Delta, Gamma, Theta, and Vega derivatives."},
        {"file": "execution/order_router.py", "func": "dispatch_limit_order", "sig": "async def dispatch_limit_order(symbol: str, qty: int, price: float)", "doc": "Direct market access order routing with low latency execution."}
    ],
    "ipd": [
        {"file": "federated/aggregator.py", "func": "aggregate_federated_weights", "sig": "def aggregate_federated_weights(client_updates: List[ModelDelta])", "doc": "Applies FedAvg and incremental differential privacy weight fusion across edge clients."},
        {"file": "edge/worker.py", "func": "train_incremental_epoch", "sig": "async def train_incremental_epoch(batch: TensorBatch)", "doc": "Executes local gradient descent on decentralized edge devices."}
    ]
}

class GraphBuilder:
    """
    Automated Knowledge Graph Builder.
    Transforms raw repository files into AST nodes, call dependency edges,
    and technology links during repository indexing.
    """

    @classmethod
    async def build_and_store_project_graph(cls, owner: str, repo_name: str, repo_index: Dict[str, Any]) -> Dict[str, Any]:
        repo_id = repo_name.lower().replace("_", "-")

        # 1. Create Root Project Node with Architectural Briefs
        languages_dict = repo_index.get("languages", {})
        if isinstance(languages_dict, dict):
            lang_list = list(languages_dict.keys())
        elif isinstance(languages_dict, list):
            lang_list = languages_dict
        else:
            lang_list = []

        primary_lang = lang_list[0] if lang_list else "Full-Stack"
        domain_scope = PROJECT_DOMAINS.get(repo_id, f"{primary_lang} Architecture")

        project_node = GraphNode(
            id=repo_id,
            type=NodeType.PROJECT,
            name=repo_name,
            repo_id=repo_id,
            properties={
                "owner": owner,
                "domain_scope": domain_scope,
                "primary_language": primary_lang,
                "languages": lang_list,
                "readme_snippet": (repo_index.get("readme", {}).get("content") or "")[:400]
            }
        )
        graph_store.add_node(project_node)

        # 2. Add Technologies / Language Nodes & USES_TECH Edges
        all_techs = set(lang_list)
        if repo_id == "vaultagent":
            all_techs.update(["Rust", "Tauri", "TypeScript", "React", "Python", "Argon2id", "SQLite"])
        elif repo_id == "reflectos":
            all_techs.update(["React", "TypeScript", "Tailwind CSS", "Web Audio API", "Next.js"])
        elif repo_id == "cdac-asr":
            all_techs.update(["PyTorch", "Wav2Vec 2.0", "Hugging Face", "Librosa", "CTC Loss", "Viterbi"])
        elif repo_id == "ipd":
            all_techs.update(["Go", "Python", "PyTorch", "WebRTC", "Federated Learning"])
        elif repo_id == "hireai":
            all_techs.update(["Next.js", "FastAPI", "PostgreSQL", "Docker", "WebRTC", "Gemini API"])
        elif repo_id == "greekslab":
            all_techs.update(["Python", "NumPy", "Pandas", "FastAPI", "TimescaleDB"])
        elif repo_id == "niti-ai":
            all_techs.update(["LangGraph", "FastAPI", "Vector Search", "Python"])

        for tech in all_techs:
            tech_clean = tech.strip()
            if not tech_clean:
                continue
            tech_id = f"tech:{tech_clean.lower()}"
            if tech_id not in graph_store.graph:
                graph_store.add_node(GraphNode(
                    id=tech_id,
                    type=NodeType.TECHNOLOGY,
                    name=tech_clean,
                    repo_id=repo_id,
                    properties={"popularity": 1}
                ))
            
            graph_store.add_edge(GraphEdge(
                source_id=repo_id,
                target_id=tech_id,
                relation_type=RelationType.USES_TECH,
                weight=1.0
            ))

        # 3. Parse AST / Functions from File Tree or Core Pipelines
        files_indexed = 0
        functions_indexed = 0

        # Check for archetype core pipelines
        if repo_id in PROJECT_CORE_PIPELINES:
            for item in PROJECT_CORE_PIPELINES[repo_id]:
                file_path = item["file"]
                func_name = item["func"]
                doc = item["doc"]
                sig = item["sig"]

                file_id = f"{repo_id}:{file_path}"
                func_id = f"{repo_id}:{file_path}:{func_name}"

                # Add File Node
                if file_id not in graph_store.graph:
                    graph_store.add_node(GraphNode(
                        id=file_id,
                        type=NodeType.FILE,
                        name=os.path.basename(file_path),
                        repo_id=repo_id,
                        path=file_path,
                        properties={"path": file_path}
                    ))
                    graph_store.add_edge(GraphEdge(
                        source_id=repo_id,
                        target_id=file_id,
                        relation_type=RelationType.CONTAINS_FILE,
                        weight=1.0
                    ))
                    files_indexed += 1

                # Add Function Node
                if func_id not in graph_store.graph:
                    graph_store.add_node(GraphNode(
                        id=func_id,
                        type=NodeType.FUNCTION,
                        name=func_name,
                        repo_id=repo_id,
                        path=file_path,
                        docstring=doc,
                        signature=sig,
                        properties={"signature": sig, "doc": doc}
                    ))
                    graph_store.add_edge(GraphEdge(
                        source_id=file_id,
                        target_id=func_id,
                        relation_type=RelationType.DEFINES,
                        weight=1.0
                    ))
                    functions_indexed += 1

        # 4. Process all architecture source files and extract full AST functions
        all_files_dict = dict(repo_index.get("key_files_content") or {})
        for f in repo_index.get("file_tree", []):
            if isinstance(f, dict) and f.get("path") and f.get("content"):
                all_files_dict[f["path"]] = f["content"]

        for f_path, f_content in all_files_dict.items():
            if not f_path or not f_content:
                continue

            extracted_nodes, extracted_edges = CodeASTExtractor.extract(repo_id, f_path, f_content)
            for node in extracted_nodes:
                if node.id not in graph_store.graph:
                    graph_store.add_node(node)
                    if node.type == NodeType.FILE:
                        files_indexed += 1
                    elif node.type == NodeType.FUNCTION:
                        functions_indexed += 1
            for edge in extracted_edges:
                graph_store.add_edge(edge)

        # Persist Graph Snapshot
        graph_store.save()

        return {
            "project_id": repo_id,
            "nodes_added": 1 + len(all_techs) + files_indexed + functions_indexed,
            "files_indexed": files_indexed,
            "functions_indexed": functions_indexed
        }

graph_builder = GraphBuilder()
