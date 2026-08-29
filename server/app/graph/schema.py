from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class NodeType(str, Enum):
    PROJECT = "PROJECT"
    FILE = "FILE"
    FUNCTION = "FUNCTION"
    CLASS = "CLASS"
    TECHNOLOGY = "TECHNOLOGY"
    EXPERIENCE = "EXPERIENCE"

class RelationType(str, Enum):
    CONTAINS_FILE = "CONTAINS_FILE"
    DEFINES = "DEFINES"
    CALLS = "CALLS"
    DEPENDS_ON = "DEPENDS_ON"
    IMPORTS = "IMPORTS"
    USES_TECH = "USES_TECH"
    BUILT_DURING = "BUILT_DURING"

class GraphNode(BaseModel):
    id: str = Field(..., description="Unique deterministic node identifier (e.g., cdac-asr:model/ctc_align.py:align_phonemes)")
    type: NodeType = Field(..., description="Entity type of the node")
    name: str = Field(..., description="Human readable label or symbol name")
    repo_id: str = Field(..., description="Repository ID (e.g. cdac-asr)")
    path: Optional[str] = Field(None, description="Relative file path if applicable")
    signature: Optional[str] = Field(None, description="Function/class signature")
    docstring: Optional[str] = Field(None, description="Docstring or extracted summary")
    code_snippet: Optional[str] = Field(None, description="Actual source code snippet")
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    properties: Dict[str, Any] = Field(default_factory=dict, description="Custom metadata attributes")
    embedding: Optional[List[float]] = Field(None, description="Vector embedding for semantic search")

class GraphEdge(BaseModel):
    source_id: str = Field(..., description="Source node identifier")
    target_id: str = Field(..., description="Target node identifier")
    relation_type: RelationType = Field(..., description="Relationship type")
    weight: float = Field(default=1.0, description="Edge weight / confidence")
    properties: Dict[str, Any] = Field(default_factory=dict)

class GraphQueryResult(BaseModel):
    matched_node: GraphNode
    score: float
    parent_file: Optional[GraphNode] = None
    parent_project: Optional[GraphNode] = None
    called_functions: List[GraphNode] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    dependency_chain: List[str] = Field(default_factory=list)
