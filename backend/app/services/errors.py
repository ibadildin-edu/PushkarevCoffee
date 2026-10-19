class ServiceError(Exception):
    """Base class for domain errors mapped to HTTP responses in app.main."""

    status_code = 400

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class NotFoundError(ServiceError):
    status_code = 404


class ConflictError(ServiceError):
    status_code = 409


class ValidationError(ServiceError):
    status_code = 422
