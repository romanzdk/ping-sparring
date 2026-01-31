from pydantic import BaseModel, EmailStr, Field


class ContactRequest(BaseModel):
    name: str | None = Field(None, max_length=200)
    email: EmailStr
    subject: str | None = Field(None, max_length=300)
    message: str = Field(..., min_length=1, max_length=5000)


class ContactResponse(BaseModel):
    message: str = "Zpráva byla odeslána."
