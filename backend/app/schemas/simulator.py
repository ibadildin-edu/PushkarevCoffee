from pydantic import BaseModel


class SimulatorState(BaseModel):
    enabled: bool


class SimulatorUpdate(BaseModel):
    enabled: bool
