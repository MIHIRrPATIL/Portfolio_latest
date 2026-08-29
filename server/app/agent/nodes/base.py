from abc import ABC, abstractmethod
from app.agent.state import MasterAgentState

class BaseNode(ABC):
    name: str

    @abstractmethod
    async def execute(self, state: MasterAgentState) -> MasterAgentState:
        """Executes the node logic and updates state."""
        pass
