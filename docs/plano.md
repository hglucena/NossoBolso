# Finanças Compartilhadas

Aplicação CRUD com cinco visões de usuário — Proposta de aplicação e projeto preliminar de dados

**Integrantes:** Heitor Gabriel Lucena Albuquerque, Victória Oliveira Estrela, Jamilly Melo Fernandes  
**Docente:** Andrei Formiga — Julho de 2026

---

## 1. Descrição da aplicação

O Finanças Compartilhadas é uma aplicação web para controle de finanças pessoais e compartilhadas. A ideia central é que cada tipo de usuário enxergue uma visão diferente do sistema, com o seu próprio painel e o seu próprio trabalho. Uma pessoa cuida das próprias contas, um grupo (uma família, uma república ou um conjunto de amigos) mantém um orçamento comum com divisão de despesas, um dependente acompanha apenas a sua mesada, um consultor financeiro acompanha a carteira de clientes que o autorizaram e um administrador cuida da plataforma.

Com isso, os papéis deixam de ser apenas permissões diferentes e passam a ser visões diferentes do sistema. Cada perfil tem a sua tela e a sua rotina de uso, o que atende com folga o requisito da atividade de ter mais de um tipo de usuário com acessos distintos.

### As cinco visões de usuário

| Visão | Descrição |
|---|---|
| **Membro individual** | Visão pessoal. Vê o saldo das próprias contas, as receitas e despesas por categoria, o orçamento pessoal e as metas. É a tela de "minhas finanças". |
| **Gestor do grupo (responsável)** | Visão agregada. Vê o orçamento compartilhado inteiro (previsto contra realizado, gasto por categoria, quem lançou o quê e quem deve a quem) e faz a gestão de membros e metas do grupo. |
| **Dependente** | Visão restrita à mesada. Vê apenas a própria mesada (saldo, limite e o que já gastou) e lança os próprios gastos, sem enxergar o resto do grupo. |
| **Consultor financeiro** | Visão multi-cliente. De uma única conta, acompanha em modo leitura a carteira de clientes que o autorizaram e deixa recomendações para cada um. |
| **Administrador** | Visão operacional. Gerencia contas de usuário, categorias padrão e métricas gerais. **Não acessa o conteúdo financeiro de ninguém.** |

### Matriz de responsabilidades por visão

| Ação / visão | Membro | Gestor | Depend. | Consultor | Admin |
|---|---|---|---|---|---|
| Lançar as próprias transações | Sim | Sim | Sim | — | — |
| Ver o painel pessoal completo | Sim | Sim | — | — | — |
| Acompanhar só a própria mesada | — | — | Sim | — | — |
| Ver o orçamento do grupo | Sim | Sim | — | — | — |
| Gerenciar o grupo (membros, orçamento, metas) | — | Sim | — | — | — |
| Dividir despesas entre participantes | Sim | Sim | — | — | — |
| Acompanhar clientes autorizados (leitura) | — | — | — | Sim | — |
| Deixar recomendações a um cliente | — | — | — | Sim | — |
| Gerenciar usuários e categorias padrão | — | — | — | — | Sim |

O consultor age sempre em modo leitura, o dependente vê apenas a própria mesada, e membro e gestor participam do grupo, mas só o gestor o administra.

### Cliente e público-alvo

O cliente pensado para a aplicação é um grupo de pessoas que dividem despesas recorrentes e querem enxergar com clareza quem gastou o quê e quem deve a quem, como uma família ou uma república de estudantes. Além dessa camada compartilhada, cada pessoa tem também a sua camada de finanças pessoais. O consultor financeiro autônomo aparece como um segundo perfil de cliente, interessado em acompanhar vários clientes a partir de uma conta só.

### Versão mínima e evoluções

A aplicação foi pensada para crescer em fases, sem quebrar o que já existe. A versão mínima cobre três visões: membro, gestor e administrador. As visões de dependente e consultor entram como evolução, junto de recursos adicionais.

| Versão mínima (MVP): três visões | Evoluções: mais duas visões e extras |
|---|---|
| Cadastro e login (usuário comum e administrador) | Dependente com mesada (limite e recarga) |
| Finanças pessoais: contas, transações, categorias e orçamento | Consultor: carteira de clientes e recomendações |
| Grupo com responsável e orçamento compartilhado | Contas a pagar e lembretes de vencimento |
| Divisão de despesas (quem deve a quem) | Metas de economia e relatórios com gráficos |
| Painel pessoal e painel do grupo | Importação de extrato (CSV) e notificações |

---

## 2. Tecnologias utilizadas

As tecnologias abaixo foram escolhidas priorizando o que o nosso grupo já conhece e o que combina bem com uma aplicação CRUD acessada pela web. O backend expõe uma API, e o frontend consome essa API.

| Camada | Tecnologia | Observação |
|---|---|---|
| Backend | Python com Django e Django REST Framework | O Django já traz ORM, migrações e um painel administrativo pronto, que encaixa na visão de administrador. O DRF expõe a API que o frontend consome. |
| Banco de dados | PostgreSQL | Banco relacional que é o núcleo da aplicação. O ORM do Django cuida das migrações e do mapeamento das entidades. |
| Frontend | React | Aplicação de página única que consome a API. Para os painéis de cada visão usaremos uma biblioteca de gráficos, como Recharts ou Chart.js. |
| Autenticação | Autenticação por token (DRF) | Cada requisição é autenticada e as permissões controlam o que cada visão pode acessar. |
| Extras (opcional) | Importação de CSV e notificações por e-mail | Recursos previstos para a fase de evolução. |

O controle de acesso é a parte mais sensível do projeto, já que cada visão só pode enxergar o que lhe compete. No Django com DRF isso é feito com classes de permissão aplicadas por endpoint, o que também facilita escrever testes automáticos para cada regra.

---

## 3. Experiência prévia do nosso grupo

- **Victória** tem experiência com banco de dados relacional, incluindo o PostgreSQL, e também já teve algum contato com as ferramentas de frontend.
- **Heitor e Jamilly** têm experiência com as ferramentas de backend em Python, o que ajuda na adoção do Django e do Django REST Framework.
- O ponto em que o grupo tem **menos experiência** é o frontend em React. Por isso o React é a tecnologia que vai exigir mais estudo durante o desenvolvimento.

---

## 4. Esquema preliminar de dados

O modelo de dados foi organizado em torno da entidade Usuario. Um usuário tem contas e transações e pode participar de grupos com papéis diferentes.

**Papéis definidos por relacionamento:** O papel de sistema do usuário é apenas `comum` ou `admin`. Os outros papéis (responsável, membro, dependente e consultor) são definidos por relacionamento, e não no cadastro do usuário. Ser responsável ou dependente é um papel dentro de um grupo, guardado em `MembroGrupo.papel_no_grupo`. Ser consultor de alguém é uma autorização, guardada em `AutorizacaoConsultor`. Assim, a mesma pessoa pode ser membro de um grupo, dependente em outro e cliente de um consultor, sem precisar de vários tipos no cadastro.

### Entidades e relacionamentos

| Entidade | Campos principais | Relaciona-se com |
|---|---|---|
| Usuario | id, nome, email, senha_hash, papel_sistema (comum/admin), data_criacao | Conta, Transacao, MembroGrupo, AutorizacaoConsultor |
| Conta / Carteira | id, usuario_id, nome, saldo_inicial | Usuario, Transacao |
| Categoria | id, nome, tipo (receita/despesa), padrao, usuario_id (opcional) | Transacao, Orcamento |
| Transacao | id, usuario_id, conta_id, categoria_id, grupo_id (opcional), tipo, valor, data, descricao | Usuario, Conta, Categoria, Grupo, DivisaoDespesa |
| Grupo | id, nome, responsavel_id, data_criacao | Usuario, MembroGrupo, Orcamento, Transacao |
| MembroGrupo | id, grupo_id, usuario_id, papel_no_grupo (responsavel/membro/dependente) | Grupo, Usuario |
| Orcamento / Meta | id, usuario_id (opcional), grupo_id (opcional), categoria_id, valor_limite, periodo | Usuario, Grupo, Categoria |
| Mesada | id, dependente_id, grupo_id, valor, periodo_recarga, saldo_atual | Usuario, Grupo |
| DivisaoDespesa | id, transacao_id, participante_id, valor_devido, pago | Transacao, Usuario |
| AutorizacaoConsultor | id, consultor_id, cliente_id, nivel (leitura/comentar), status | Usuario |
| ContaAPagar | id, usuario_id, descricao, valor, vencimento, recorrencia, pago | Usuario |
| Recomendacao | id, consultor_id, cliente_id, texto, data | Usuario |

---

## 5. Critérios de validação e aceitação

### Acesso e isolamento entre visões

1. Um dependente não acessa nada além da própria mesada e dos próprios lançamentos.
2. Um consultor só enxerga os clientes que o autorizaram, e apenas em modo leitura, sem alterar dados.
3. O responsável vê o grupo inteiro, mas não as finanças pessoais que um membro não compartilhou.
4. O administrador nunca acessa as transações financeiras de nenhum usuário.
5. Cada usuário só acessa as próprias transações pessoais.
6. Uma recomendação só pode ser criada por um consultor autorizado por aquele cliente.

### Integridade dos dados

7. Uma despesa dividida sempre fecha: a soma das partes dos participantes é igual ao valor total da transação.
8. Toda transação pertence a um usuário e a uma conta válidos, e usa uma categoria existente.
9. O saldo de uma mesada respeita o limite definido para o período.

### Aceitação da versão mínima

Para o cliente aceitar uma primeira versão, a aplicação precisa permitir, no mínimo:

- Um usuário se cadastra, faz login e se distingue de um administrador.
- Um usuário cria contas e categorias e lança transações pessoais.
- Um usuário cria um grupo, entra como responsável e convida outros membros.
- O grupo registra uma despesa e a divide entre os participantes, com o sistema mostrando quem deve a quem.
- Cada usuário vê o painel pessoal e o painel do grupo com os valores corretos.

---

## 6. Como os critérios serão testados

### Testes automáticos

O Django e o DRF têm um framework de testes próprio. Para cada critério de acesso escreveremos um teste que simula um tipo de usuário e verifica se ele consegue ou não acessar determinado recurso.

Casos de teste previstos:

- Um administrador tenta abrir as transações de um usuário → acesso negado.
- Um dependente tenta registrar um gasto acima do limite da mesada → bloqueado.
- Um consultor tenta acessar um cliente que não o autorizou → acesso recusado.
- Um consultor autorizado somente em modo leitura tenta gravar uma recomendação → recusado.
- Um responsável tenta ver finanças pessoais não compartilhadas de um membro → só aparecem dados do grupo.
- Uma transação é criada apontando para conta ou categoria inexistente → recusada.
- Requisição sem token de autenticação a recurso protegido → acesso negado.

### Consulta ao cliente

Os critérios de aceitação da versão mínima serão validados diretamente com o cliente (uma família ou república). O cliente percorre os fluxos principais — cadastro, lançamento de transações, criação de grupo e divisão de despesa — e confirma se o resultado corresponde ao esperado.

---

## 7. Pontos ainda a alinhar

- **Divisão de despesas:** em partes iguais entre todos ou por valores e percentuais definidos por lançamento.
- **Mesada:** recarga automática por período ou recarga manual feita pelo responsável.
- **Consultor:** manter apenas leitura ou permitir também sugerir ajustes de orçamento ao cliente.
- **Relatórios e gráficos:** incluir já na versão mínima ou deixar para a fase de evolução.
- **Definição de um cliente real específico** (uma família, uma república ou um consultor autônomo) para acompanhar a validação.
