from rest_framework import serializers

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


# ─── Usuário ───────────────────────────────────────────────────────────

class CadastroSerializer(serializers.ModelSerializer):
    senha = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Usuario
        fields = ["id", "email", "nome", "senha"]

    def create(self, validated_data):
        senha = validated_data.pop("senha")
        return Usuario.objects.create_user(
            password=senha,
            papel_sistema="comum",
            **validated_data,
        )


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "email", "nome", "papel_sistema", "data_criacao"]
        read_only_fields = ["id", "papel_sistema", "data_criacao"]


class UsuarioAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "email", "nome", "papel_sistema", "is_active", "data_criacao"]
        read_only_fields = ["id", "data_criacao"]


# ─── Conta ─────────────────────────────────────────────────────────────

class ContaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conta
        fields = ["id", "nome", "saldo_inicial", "ativa", "usuario"]
        read_only_fields = ["id", "usuario"]


# ─── Categoria ─────────────────────────────────────────────────────────

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nome", "tipo", "padrao", "usuario"]
        read_only_fields = ["id", "usuario"]


class CategoriaAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nome", "tipo", "padrao"]
        read_only_fields = ["id"]


# ─── Grupo ─────────────────────────────────────────────────────────────

class GrupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grupo
        fields = ["id", "nome", "descricao", "responsavel", "data_criacao", "ativo"]
        read_only_fields = ["id", "responsavel", "data_criacao"]


class MembroGrupoSerializer(serializers.ModelSerializer):
    nome_usuario = serializers.CharField(source="usuario.nome", read_only=True)
    email_usuario = serializers.CharField(source="usuario.email", read_only=True)

    class Meta:
        model = MembroGrupo
        fields = ["id", "grupo", "usuario", "nome_usuario", "email_usuario", "papel_no_grupo", "data_entrada"]
        read_only_fields = ["id", "grupo", "nome_usuario", "email_usuario", "data_entrada"]


# ─── Transação ─────────────────────────────────────────────────────────

class DivisaoDespesaSerializer(serializers.ModelSerializer):
    nome_participante = serializers.CharField(source="participante.nome", read_only=True)

    class Meta:
        model = DivisaoDespesa
        fields = ["id", "transacao", "participante", "nome_participante", "valor_devido", "pago"]
        read_only_fields = ["id", "nome_participante"]


class TransacaoSerializer(serializers.ModelSerializer):
    divisoes = DivisaoDespesaSerializer(many=True, read_only=True)
    nome_conta = serializers.CharField(source="conta.nome", read_only=True)
    nome_categoria = serializers.CharField(source="categoria.nome", read_only=True)

    class Meta:
        model = Transacao
        fields = [
            "id", "usuario", "conta", "nome_conta", "categoria", "nome_categoria",
            "tipo", "valor", "descricao", "data", "grupo", "fixa", "divisoes",
        ]
        read_only_fields = ["id", "usuario", "nome_conta", "nome_categoria"]


class TransacaoCreateSerializer(serializers.ModelSerializer):
    divisoes = DivisaoDespesaSerializer(many=True, required=False)

    class Meta:
        model = Transacao
        fields = ["id", "conta", "categoria", "tipo", "valor", "descricao", "data", "grupo", "fixa", "divisoes"]
        read_only_fields = ["id"]

    def validate(self, data):
        divisoes = self.initial_data.get("divisoes", [])
        if divisoes:
            total_divisoes = sum(float(d.get("valor_devido", 0)) for d in divisoes)
            if abs(total_divisoes - float(data.get("valor", 0))) > 0.01:
                raise serializers.ValidationError(
                    "A soma das partes da divisão deve ser igual ao valor total da transação."
                )
        return data

    def create(self, validated_data):
        divisoes_data = self.initial_data.get("divisoes", [])
        validated_data.pop("divisoes", None)
        transacao = Transacao.objects.create(**validated_data)
        for div in divisoes_data:
            DivisaoDespesa.objects.create(
                transacao=transacao,
                participante_id=div["participante"],
                valor_devido=div["valor_devido"],
            )
        return transacao


# ─── Orçamento ─────────────────────────────────────────────────────────

class OrcamentoSerializer(serializers.ModelSerializer):
    nome_categoria = serializers.CharField(source="categoria.nome", read_only=True)

    class Meta:
        model = Orcamento
        fields = ["id", "usuario", "grupo", "categoria", "nome_categoria", "valor_limite", "periodo"]
        read_only_fields = ["id", "nome_categoria"]
