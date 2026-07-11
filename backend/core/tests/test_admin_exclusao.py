from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Categoria, Conta, Grupo, MembroGrupo, Transacao, Usuario


class AdminUsuariosTestCase(APITestCase):
    """Gestão de usuários pelo admin: criação com senha, exclusão e proteções."""

    def setUp(self):
        self.admin = Usuario.objects.create_superuser("admin@test.com", "Admin", "senha123")
        self.user = Usuario.objects.create_user("user@test.com", "Usuario", "senha123")

        login = self.client.post("/api/login/", {"username": "admin@test.com", "password": "senha123"})
        self.client.credentials(HTTP_AUTHORIZATION="Token " + login.data["token"])

    def test_admin_cria_usuario_com_senha_e_ele_consegue_logar(self):
        response = self.client.post("/api/usuarios/", {
            "email": "novo@test.com", "nome": "Novo", "senha": "senha456",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        login = self.client.post("/api/login/", {"username": "novo@test.com", "password": "senha456"})
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn("token", login.data)

    def test_admin_nao_cria_usuario_sem_senha(self):
        response = self.client.post("/api/usuarios/", {"email": "novo@test.com", "nome": "Novo"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("senha", response.data)

    def test_admin_redefine_senha_de_usuario(self):
        response = self.client.patch(f"/api/usuarios/{self.user.id}/", {"senha": "novasenha1"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        login = self.client.post("/api/login/", {"username": "user@test.com", "password": "novasenha1"})
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_admin_edita_sem_senha_mantem_a_atual(self):
        response = self.client.patch(f"/api/usuarios/{self.user.id}/", {"nome": "Renomeado"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        login = self.client.post("/api/login/", {"username": "user@test.com", "password": "senha123"})
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_admin_exclui_usuario_comum(self):
        response = self.client.delete(f"/api/usuarios/{self.user.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Usuario.objects.filter(id=self.user.id).exists())

    def test_admin_exclui_usuario_com_dados_financeiros(self):
        conta = Conta.objects.create(usuario=self.user, nome="Carteira")
        categoria = Categoria.objects.create(usuario=self.user, nome="Lazer", tipo="despesa")
        Transacao.objects.create(
            usuario=self.user, conta=conta, categoria=categoria,
            tipo="despesa", valor="10.00",
        )
        response = self.client.delete(f"/api/usuarios/{self.user.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_nao_exclui_a_si_mesmo(self):
        response = self.client.delete(f"/api/usuarios/{self.admin.id}/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Usuario.objects.filter(id=self.admin.id).exists())

    def test_excluir_responsavel_de_grupo_retorna_409_amigavel(self):
        grupo = Grupo.objects.create(nome="Familia", responsavel=self.user)
        MembroGrupo.objects.create(grupo=grupo, usuario=self.user, papel_no_grupo="responsavel")
        response = self.client.delete(f"/api/usuarios/{self.user.id}/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("grupos", response.data["detail"])


class ExclusaoCategoriaTestCase(APITestCase):
    """Exclusão de categorias: livre quando sem uso, 409 amigável quando em uso."""

    def setUp(self):
        self.admin = Usuario.objects.create_superuser("admin@test.com", "Admin", "senha123")
        self.user = Usuario.objects.create_user("user@test.com", "Usuario", "senha123")

        login = self.client.post("/api/login/", {"username": "user@test.com", "password": "senha123"})
        self.token_user = login.data["token"]
        login = self.client.post("/api/login/", {"username": "admin@test.com", "password": "senha123"})
        self.token_admin = login.data["token"]

    def test_usuario_exclui_categoria_propria_sem_uso(self):
        categoria = Categoria.objects.create(usuario=self.user, nome="Lazer", tipo="despesa")
        self.client.credentials(HTTP_AUTHORIZATION="Token " + self.token_user)
        response = self.client.delete(f"/api/categorias/{categoria.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_excluir_categoria_com_transacao_retorna_409_amigavel(self):
        categoria = Categoria.objects.create(usuario=self.user, nome="Lazer", tipo="despesa")
        conta = Conta.objects.create(usuario=self.user, nome="Carteira")
        Transacao.objects.create(
            usuario=self.user, conta=conta, categoria=categoria,
            tipo="despesa", valor="10.00",
        )
        self.client.credentials(HTTP_AUTHORIZATION="Token " + self.token_user)
        response = self.client.delete(f"/api/categorias/{categoria.id}/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("transações", response.data["detail"])
        self.assertTrue(Categoria.objects.filter(id=categoria.id).exists())

    def test_admin_exclui_categoria_padrao_sem_uso(self):
        categoria = Categoria.objects.create(usuario=None, nome="Padrao", tipo="despesa", padrao=True)
        self.client.credentials(HTTP_AUTHORIZATION="Token " + self.token_admin)
        response = self.client.delete(f"/api/categorias/{categoria.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_admin_exclui_categoria_padrao_em_uso_retorna_409(self):
        categoria = Categoria.objects.create(usuario=None, nome="Padrao", tipo="despesa", padrao=True)
        conta = Conta.objects.create(usuario=self.user, nome="Carteira")
        Transacao.objects.create(
            usuario=self.user, conta=conta, categoria=categoria,
            tipo="despesa", valor="10.00",
        )
        self.client.credentials(HTTP_AUTHORIZATION="Token " + self.token_admin)
        response = self.client.delete(f"/api/categorias/{categoria.id}/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
