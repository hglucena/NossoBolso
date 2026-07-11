from django.db.models.deletion import ProtectedError, RestrictedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
    """Converte ProtectedError/RestrictedError (on_delete=PROTECT/RESTRICT) em
    409 com mensagem amigável, em vez do 500 genérico do Django."""
    response = drf_exception_handler(exc, context)
    if response is None and isinstance(exc, (ProtectedError, RestrictedError)):
        objetos = getattr(exc, "protected_objects", None) or getattr(exc, "restricted_objects", [])
        modelos = sorted({str(obj._meta.verbose_name_plural) for obj in objetos})
        detalhe = (
            "Não é possível excluir: este registro ainda está vinculado a "
            + ", ".join(modelos)
            + ". Exclua ou transfira esses vínculos primeiro."
        )
        return Response({"detail": detalhe}, status=status.HTTP_409_CONFLICT)
    return response
