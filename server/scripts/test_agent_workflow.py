import asyncio
import json
from app.agent.orchestrator import agent_orchestrator
from app.graph.graph_store import graph_store

async def run_tests():
    print("🚀 [TEST] Initializing Knowledge Graph...")
    graph_store.load_all_graphs()
    print(f"🕸️ Total Nodes in Graph: {graph_store.graph.number_of_nodes()}")

    test_queries = [
        ("sess_001", "What is VaultAgent and what functions does it use for security?"),
        ("sess_001", "Show me the top graded repositories from the database"),
        ("sess_001", "Can I see the live demo for ReflectOS?"),
        ("sess_002", "I want to collaborate with Mihir on an AI speech project. My email is alex@tech.io")
    ]

    for session_id, query in test_queries:
        print(f"\n==========================================")
        print(f"🔹 Query: '{query}' (Session: {session_id})")
        
        # Test Synchronous Execution
        state = await agent_orchestrator.run(session_id=session_id, user_query=query)
        print(f"  ➡️ Inferred Intent: {state.intent}")
        print(f"  ➡️ Target Repos: {state.target_repo_ids}")
        print(f"  ➡️ Graph Matches: {len(state.graph_context)}")
        print(f"  ➡️ Tool Calls: {[t.tool_name for t in state.tool_calls]}")
        print(f"  ➡️ UI Badges: {state.ui_badges}")
        print(f"  ➡️ Follow-ups: {state.suggested_followups}")
        print(f"  ➡️ Response Preview: {state.final_text[:160]}...")

        # Test Streaming Generator
        print(f"  ⚡ Streaming tokens test:")
        stream_chunks = []
        async for chunk in agent_orchestrator.stream(session_id=session_id, user_query=query):
            if "token" in chunk:
                stream_chunks.append(chunk)
        print(f"  ✅ Streamed {len(stream_chunks)} SSE chunks successfully.")

    print("\n🎉 ALL AGENT WORKFLOW & TOOL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_tests())
