from django.db import connections
from django.db.models import Q
from django.http import JsonResponse
from rest_framework import viewsets, generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import (
    Categoria,
    Conta,
    DivisaoDespesa,
    Grupo,
    MembroGrupo,
    Orcamento,
    Transacao,
    Usuario,
)
from core.permissions import (
    IsAdminOnly,
    IsAdminOuReadOnly,
    IsGestorDoGrupoByKwarg,
    IsOwner,
    IsOwnerOrGestorForWrite,
    IsOwnerOrGrupoMemberRead,
    IsOwnerOrReadOnly,
    NaoAdmin,
)
from core.serializers import (
    CadastroSerializer,
    CategoriaAdminSerializer,
    CategoriaSerializer,
    ContaSerializer,
    DivisaoDespesaSerializer,
    GrupoSerializer,
    MembroGrupoSerializer,
    OrcamentoSerializer,
    TransacaoCreateSerializer,
    TransacaoSerializer,
    UsuarioAdminSerializer,
    UsuarioSerializer,
)


# ══════════════════════════════════════════════════════════════════════════
# Auth
# ══════════════════════════════════════════════════════════════════════════

def health_check(request):
    db_ok = False
    try:
        connections["default"].cursor()
        db_ok = True
    except Exception:
        pass
    return JsonResponse({
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
    })


class RegistroView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = CadastroSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(ObtainAuthToken):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=usuario)
        return Response({
            "token": token.key,
            "usuario": UsuarioSerializer(usuario).data,
        })


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ══════════════════════════════════════════════════════════════════════════
# Usuário (Admin)
# ══════════════════════════════════════════════════════════════════════════

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioAdminSerializer
    permission_classes = [IsAdminOnly]


# ══════════════════════════════════════════════════════════════════════════
# Conta
# ══════════════════════════════════════════════════════════════════════════

class ContaViewSet(viewsets.ModelViewSet):
    serializer_class = ContaSerializer
    permission_classes = [permissions.IsAuthenticated, NaoAdmin, IsOwner]

    def get_queryset(self):
        return Conta.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


# ══════════════════════════════════════════════════════════════════════════
# Categoria
# ══════════════════════════════════════════════════════════════════════════

class CategoriaViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, NaoAdmin]

    def get_queryset(self):
        return Categoria.objects.filter(
            Q(usuario=self.request.user) | Q(padrao=True)
        )

    def get_serializer_class(self):
        if self.request.user.papel_sistema == "admin":
            return CategoriaAdminSerializer
        return CategoriaSerializer

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


# ══════════════════════════════════════════════════════════════════════════
# Grupo
# ══════════════════════════════════════════════════════════════════════════

class GrupoViewSet(viewsets.ModelViewSet):
    serializer_class = GrupoSerializer
    permission_classes = [permissions.IsAuthenticated, NaoAdmin]

    def get_queryset(self):
        return Grupo.objects.filter(membros__usuario=self.request.user).distinct()

    def perform_create(self, serializer):
        grupo = serializer.save(responsavel=self.request.user)
        MembroGrupo.objects.create(
            grupo=grupo,
            usuario=self.request.user,
            papel_no_grupo="responsavel",
        )

    @action(detail=True, methods=["get"])
    def saldo(self, request, pk=None):
        grupo = self.get_object()
        membros = MembroGrupo.objects.filter(grupo=grupo).values_list("usuario_id", flat=True)
        transacoes = Transacao.objects.filter(grupo=grupo)
        total_receitas = sum(t.valor for t in transacoes if t.tipo == "receita")
        total_despesas = sum(t.valor for t in transacoes if t.tipo == "despesa")
        return Response({
            "grupo": grupo.nome,
            "total_receitas": total_receitas,
            "total_despesas": total_despesas,
            "saldo": total_receitas - total_despesas,
            "quantidade_membros": membros.count(),
        })


# ══════════════════════════════════════════════════════════════════════════
# MembroGrupo (aninhado em grupo)
# ══════════════════════════════════════════════════════════════════════════

class MembroGrupoViewSet(viewsets.ModelViewSet):
    serializer_class = MembroGrupoSerializer
    permission_classes = [permissions.IsAuthenticated, NaoAdmin, IsGestorDoGrupoByKwarg]

    def get_queryset(self):
        return MembroGrupo.objects.filter(grupo_id=self.kwargs["grupo_pk"])

    def perform_create(self, serializer):
        serializer.save(grupo_id=self.kwargs["grupo_pk"])


# ══════════════════════════════════════════════════════════════════════════
# Transação
# ══════════════════════════════════════════════════════════════════════════

class TransacaoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, NaoAdmin]

    def get_queryset(self):
        user = self.request.user
        grupos_ids = MembroGrupo.objects.filter(usuario=user).values_list("grupo_id", flat=True)
        return Transacao.objects.filter(
            Q(usuario=user) | Q(grupo_id__in=grupos_ids)
        ).order_by("-data")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return TransacaoCreateSerializer
        return TransacaoSerializer

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), NaoAdmin(), IsOwnerOrGrupoMemberRead()]
        return [permissions.IsAuthenticated(), NaoAdmin()]

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


# ══════════════════════════════════════════════════════════════════════════
# Orçamento
# ══════════════════════════════════════════════════════════════════════════

class OrcamentoViewSet(viewsets.ModelViewSet):
    serializer_class = OrcamentoSerializer
    permission_classes = [permissions.IsAuthenticated, NaoAdmin]

    def get_queryset(self):
        user = self.request.user
        grupos_ids = MembroGrupo.objects.filter(usuario=user).values_list("grupo_id", flat=True)
        return Orcamento.objects.filter(
            Q(usuario=user) | Q(grupo_id__in=grupos_ids)
        )

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), NaoAdmin(), IsOwnerOrGestorForWrite()]
        return [permissions.IsAuthenticated(), NaoAdmin()]

    def perform_create(self, serializer):
        if serializer.validated_data.get("grupo"):
            serializer.save()
        else:
            serializer.save(usuario=self.request.user)


# ══════════════════════════════════════════════════════════════════════════
# Divisão de Despesa (aninhada em transação ou grupo)
# ══════════════════════════════════════════════════════════════════════════

class DivisaoDespesaViewSet(viewsets.ModelViewSet):
    serializer_class = DivisaoDespesaSerializer
    permission_classes = [permissions.IsAuthenticated, NaoAdmin, IsGestorDoGrupoByKwarg]

    def get_queryset(self):
        return DivisaoDespesa.objects.filter(
            transacao__grupo_id=self.kwargs["grupo_pk"]
        )
