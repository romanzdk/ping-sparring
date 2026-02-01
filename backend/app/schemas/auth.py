from pydantic import BaseModel, EmailStr, model_validator


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str  # "player" or "club"
    first_name: str | None = None
    last_name: str | None = None
    club_name: str | None = None

    @model_validator(mode="after")
    def role_required_fields(self):
        r = (self.role or "").strip().lower()
        if r == "club":
            if not (self.club_name and self.club_name.strip()):
                raise ValueError("Pro registraci klubu je povinný název klubu.")
        elif r == "player":
            if not (self.first_name and self.first_name.strip()):
                raise ValueError("Pro registraci hráče je povinné alespoň křestní jméno.")
        return self


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr
