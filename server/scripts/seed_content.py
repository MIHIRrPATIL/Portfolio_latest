from app.db.session import SessionLocal
from app.db.crud import upsert_achievement, upsert_blog, create_visitor_lead

def seed():
    with SessionLocal() as db:
        # 1. Seed Achievements
        upsert_achievement(db, {
            "id": "cdac-speech-research-fellowship",
            "title": "Speech AI Research & Acoustic Modeling at CDAC",
            "category": "Research",
            "date": "2025 - 2026",
            "description": "Engineered end-to-end Indic ASR pipelines with fine-tuned Wav2Vec 2.0, CTC loss optimization, and dynamic Viterbi forced alignment algorithms.",
            "proof_url": "https://github.com/MIHIRrPATIL/CDAC_ASR",
            "icon": "award",
            "tags": ["PyTorch", "Wav2Vec2", "Speech AI", "CTC"],
            "is_featured": True
        })

        upsert_achievement(db, {
            "id": "sih-national-finalist",
            "title": "Smart India Hackathon (SIH) National Finalist",
            "category": "Hackathon",
            "date": "2024",
            "description": "Built decentralized legal AI intelligence platform with multi-agent legal query retrieval and dynamic vector embeddings.",
            "proof_url": "https://github.com/MIHIRrPATIL/Niti_AI",
            "icon": "trophy",
            "tags": ["FastAPI", "LangChain", "Next.js", "AI"],
            "is_featured": True
        })

        # 2. Seed Blog Post
        upsert_blog(db, {
            "id": "building-realtime-graphrag-ai-copilots",
            "title": "Architecting Real-Time GraphRAG AI Copilots with AST Code Maps",
            "summary": "Why traditional vector-only RAG fails on codebases and how multi-hop AST Knowledge Graphs unlock deterministic code intelligence.",
            "content": """# Architecting Real-Time GraphRAG AI Copilots with AST Code Maps

When developers interact with AI copilots across large repositories, traditional vector similarity search often suffers from severe **context blindness**. Vector embeddings compress entire files into fixed-dimensional vectors, losing the deterministic structure of functions, parameters, and call graphs.

### The Solution: Multi-Hop AST Knowledge Graphs
By parsing Python (`ast`), TypeScript, Rust, and Go files into Abstract Syntax Trees, we construct a relational graph where:
1. **Nodes** represent functions, files, classes, and technologies.
2. **Edges** capture exact dependency relationships (`CALLS`, `DEFINES`, `IMPORTS`).

```python
# Example AST node linking
class GraphNode:
    id: str  # e.g., 'cdac-asr:aligner.py:compute_phonemes'
    signature: str
    called_functions: list[str]
```

### Zero-Latency Traversal
When a visitor asks *'How does CDAC ASR compute phoneme alignment?'*, the engine performs multi-hop graph traversal in less than 5 milliseconds, feeding the LLM exact verified source code signatures with zero hallucinations.
""",
            "cover_image": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
            "tags": ["GraphRAG", "AI Agents", "FastAPI", "Architecture"],
            "read_time": "4 min read",
            "is_published": True
        })

        # 3. Seed Sample Lead
        create_visitor_lead(db, {
            "visitor_name": "Sarah Chen",
            "email": "sarah.chen@techcorp.io",
            "project_scope": "Distributed Systems & Federated Learning",
            "message": "Hey Mihir, loved your work on IPD federated learning. Would love to discuss a consulting collaboration on edge model aggregation.",
            "status": "pending",
            "notes": "High priority enterprise inquiry"
        })

        print("✅ Seeded initial achievements, blog post, and sample inquiry successfully.")

if __name__ == "__main__":
    seed()
