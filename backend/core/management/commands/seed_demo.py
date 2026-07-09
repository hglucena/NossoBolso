from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

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


class Command(BaseCommand):
    help = "Popula o banco com dados de demonstracao"

    def handle(self, *args, **options):
        self.stdout.write("Criando dados de demonstracao...")

        # ── Usuarios ──────────────────────────────────────────────────
        admin, _ = Usuario.objects.get_or_create(
            email="admin@demo.com",
            defaults={
                "nome": "Administrador Demo",
                "papel_sistema": "admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.set_password("admin123")
        admin.save()

        joao, _ = Usuario.objects.get_or_create(
            email="joao@demo.com",
            defaults={"nome": "Joao Silva", "papel_sistema": "comum"},
        )
        joao.set_password("senha123")
        joao.save()

        maria, _ = Usuario.objects.get_or_create(
            email="maria@demo.com",
            defaults={"nome": "Maria Oliveira", "papel_sistema": "comum"},
        )
        maria.set_password("senha123")
        maria.save()

        self.stdout.write(self.style.SUCCESS(f"  Usuarios criados: admin, joao, maria (senha: senha123 / admin: admin123)"))

        # ── Categorias padrao ─────────────────────────────────────────
        cats_data = [
            ("Alimentacao", "despesa"),
            ("Transporte", "despesa"),
            ("Moradia", "despesa"),
            ("Lazer", "despesa"),
            ("Saude", "despesa"),
            ("Salario", "receita"),
            ("Freelance", "receita"),
            ("Investimentos", "receita"),
        ]
        categorias = {}
        for nome, tipo in cats_data:
            cat, _ = Categoria.objects.get_or_create(
                usuario=None, nome=nome,
                defaults={"tipo": tipo, "padrao": True},
            )
            categorias[nome] = cat

        self.stdout.write(f"  Categorias padrao: {len(categorias)}")

        # ── Categorias pessoais ───────────────────────────────────────
        for user, cats_pessoais in [
            (joao, [("Cinema", "despesa"), ("Academia", "despesa")]),
            (maria, [("Livros", "despesa"), ("Viagem", "despesa")]),
        ]:
            for nome, tipo in cats_pessoais:
                cat, _ = Categoria.objects.get_or_create(
                    usuario=user, nome=nome,
                    defaults={"tipo": tipo, "padrao": False},
                )

        # ── Contas ────────────────────────────────────────────────────
        conta_joao, _ = Conta.objects.get_or_create(
            usuario=joao, nome="Conta Corrente",
            defaults={"saldo_inicial": Decimal("5000.00")},
        )
        Conta.objects.get_or_create(
            usuario=joao, nome="Poupanca",
            defaults={"saldo_inicial": Decimal("10000.00")},
        )
        conta_maria, _ = Conta.objects.get_or_create(
            usuario=maria, nome="Carteira",
            defaults={"saldo_inicial": Decimal("3000.00")},
        )

        self.stdout.write("  Contas criadas")

        # ── Transacoes pessoais ───────────────────────────────────────
        agora = timezone.now()

        transacoes_joao = [
            ("receita", Decimal("7000.00"), "Salario mensal", categorias["Salario"]),
            ("despesa", Decimal("150.00"), "Supermercado", categorias["Alimentacao"]),
            ("despesa", Decimal("80.00"), "Gasolina", categorias["Transporte"]),
            ("despesa", Decimal("45.00"), "Cinema", Categoria.objects.get(usuario=joao, nome="Cinema")),
        ]
        for tipo, valor, desc, cat in transacoes_joao:
            Transacao.objects.create(
                usuario=joao, conta=conta_joao, categoria=cat,
                tipo=tipo, valor=valor, descricao=desc, data=agora,
            )

        transacoes_maria = [
            ("receita", Decimal("4500.00"), "Salario mensal", categorias["Salario"]),
            ("despesa", Decimal("120.00"), "Restaurante", categorias["Alimentacao"]),
            ("despesa", Decimal("50.00"), "Livraria", Categoria.objects.get(usuario=maria, nome="Livros")),
        ]
        for tipo, valor, desc, cat in transacoes_maria:
            Transacao.objects.create(
                usuario=maria, conta=conta_maria, categoria=cat,
                tipo=tipo, valor=valor, descricao=desc, data=agora,
            )

        self.stdout.write("  Transacoes pessoais criadas")

        # ── Orcamentos pessoais ───────────────────────────────────────
        Orcamento.objects.get_or_create(
            usuario=joao, categoria=categorias["Alimentacao"],
            defaults={"valor_limite": Decimal("800.00"), "periodo": agora.date()},
        )
        Orcamento.objects.get_or_create(
            usuario=joao, categoria=categorias["Lazer"],
            defaults={"valor_limite": Decimal("300.00"), "periodo": agora.date()},
        )

        # ── Grupo ─────────────────────────────────────────────────────
        grupo, created = Grupo.objects.get_or_create(
            nome="Republica Central",
            defaults={
                "descricao": "Despesas compartilhadas da republica",
                "responsavel": joao,
            },
        )

        MembroGrupo.objects.get_or_create(
            grupo=grupo, usuario=joao,
            defaults={"papel_no_grupo": "responsavel"},
        )
        MembroGrupo.objects.get_or_create(
            grupo=grupo, usuario=maria,
            defaults={"papel_no_grupo": "membro"},
        )

        self.stdout.write(f"  Grupo '{grupo.nome}' criado com 2 membros")

        # ── Despesa dividida do grupo ─────────────────────────────────
        despesa, created = Transacao.objects.get_or_create(
            usuario=joao,
            conta=conta_joao,
            categoria=categorias["Moradia"],
            tipo="despesa",
            valor=Decimal("600.00"),
            descricao="Aluguel do mes",
            grupo=grupo,
            defaults={"data": agora},
        )

        for participante, valor in [(joao, Decimal("300.00")), (maria, Decimal("300.00"))]:
            DivisaoDespesa.objects.get_or_create(
                transacao=despesa,
                participante=participante,
                defaults={"valor_devido": valor},
            )

        despesa2, _ = Transacao.objects.get_or_create(
            usuario=joao,
            conta=conta_joao,
            categoria=categorias["Alimentacao"],
            tipo="despesa",
            valor=Decimal("200.00"),
            descricao="Compras do mes",
            grupo=grupo,
            defaults={"data": agora},
        )
        for participante, valor in [(joao, Decimal("100.00")), (maria, Decimal("100.00"))]:
            DivisaoDespesa.objects.get_or_create(
                transacao=despesa2,
                participante=participante,
                defaults={"valor_devido": valor},
            )

        # ── Orcamento do grupo ────────────────────────────────────────
        Orcamento.objects.get_or_create(
            grupo=grupo, categoria=categorias["Moradia"],
            defaults={"valor_limite": Decimal("700.00"), "periodo": agora.date()},
        )
        Orcamento.objects.get_or_create(
            grupo=grupo, categoria=categorias["Alimentacao"],
            defaults={"valor_limite": Decimal("500.00"), "periodo": agora.date()},
        )

        self.stdout.write("  Despesas divididas e orcamentos do grupo criados")

        # ── Resumo ────────────────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS(
            "\n=== Dados de demonstracao prontos! ===\n"
            "  Login: http://localhost:5173/login\n"
            "  Joao (comum):  joao@demo.com  / senha123\n"
            "  Maria (comum): maria@demo.com  / senha123\n"
            "  Admin:         admin@demo.com  / admin123\n"
        ))
