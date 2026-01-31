from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=False, unique=True)

    # Relationships
    districts = relationship("District", back_populates="region")


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)

    # Relationships
    region = relationship("Region", back_populates="districts")
    trainings = relationship("Training", back_populates="district")
