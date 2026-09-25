# Passo a Passo de Configuração do Google Cloud OAuth para Studio Melk Gestão

Este guia descreve os passos exatos para configurar as credenciais do Google Cloud Console e integrar a API do Google Calendar ao projeto **Studio Melk Gestão**.

---

## 1. Criar Projeto no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. No menu superior, clique no seletor de projetos e clique em **Novo Projeto** (*New Project*).
3. Nomeie o projeto como: `Studio Melk Gestao` (ou outro nome de sua preferência).
4. Clique em **Criar** (*Create*).

---

## 2. Ativar a API do Google Calendar

1. No painel do projeto criado, acesse o menu **APIs e Serviços** > **Biblioteca** (*APIs & Services > Library*).
2. Na barra de pesquisa, digite `Google Calendar API`.
3. Selecione **Google Calendar API** e clique em **Ativar** (*Enable*).

---

## 3. Configurar a Tela de Consentimento OAuth (OAuth Consent Screen)

1. Acesse **APIs e Serviços** > **Tela de consentimento OAuth** (*OAuth consent screen*).
2. Escolha o tipo de usuário:
   - Para uso pessoal do estúdio, selecione **Externo** (*External*) e clique em **Criar**.
3. Preencha os dados da aplicação:
   - **Nome do App**: `Studio Melk Gestão`
   - **E-mail de suporte**: Seu e-mail Google (`studiomelk@gmail.com` ou o seu e-mail de acesso).
   - **E-mail do desenvolvedor**: Seu e-mail Google.
4. Clique em **Salvar e Continuar**.
5. Na etapa de **Escopos** (*Scopes*), clique em **Adicionar ou Remover Escopos** e selecione:
   - `https://www.googleapis.com/auth/calendar.events.owned` (ou `https://www.googleapis.com/auth/calendar`)
   - `https://www.googleapis.com/auth/userinfo.email`
6. Na etapa de **Usuários de Teste** (*Test Users*):
   - Adicione o seu e-mail pessoal Google (o mesmo que gerencia a agenda do Studio Melk onde os eventos devem ser criados).
7. Clique em **Salvar e Continuar**.

---

## 4. Criar o Cliente OAuth (OAuth 2.0 Client ID)

1. Acesse **APIs e Serviços** > **Credenciais** (*Credentials*).
2. Clique em **+ Criar Credenciais** > **ID do cliente OAuth** (*OAuth client ID*).
3. Em **Tipo de aplicativo**, selecione **Aplicativo da Web** (*Web application*).
4. **Nome**: `Studio Melk Web`
5. Em **URIs de redirecionamento autorizados** (*Authorized redirect URIs*), clique em **+ Adicionar URI** e insira exatamente a URL da Vercel:
   ```text
   https://agenda-studiomelk.vercel.app/api/google/callback
   ```
   *(Substitua `agenda-studiomelk.vercel.app` pelo seu domínio oficial final na Vercel, se for diferente).*

   Se também quiser testar localmente em desenvolvimento, adicione:
   ```text
   http://localhost:3000/api/google/callback
   ```
6. Clique em **Criar**.
7. O Google exibirá na tela o **ID de cliente** (*Client ID*) e a **Chave secreta do cliente** (*Client Secret*). Guarde ambos em local seguro.

---

## 5. Configurar as Variáveis de Ambiente na Vercel

No painel da Vercel (em **Project Settings > Environment Variables**), adicione as seguintes variáveis:

| Nome da Variável | Exemplo / Descrição |
| :--- | :--- |
| `GOOGLE_CLIENT_ID` | `1234567890-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxxxxxxxxx` |
| `GOOGLE_REDIRECT_URI` | `https://SEU-DOMINIO-VERCEL.vercel.app/api/google/callback` |
| `GOOGLE_CALENDAR_ID` | `primary` |
| `COOKIE_SECRET` | Uma chave secreta aleatória (ex.: `melk-secret-key-32-chars-length!!`) |
| `APP_BASE_URL` | `https://SEU-DOMINIO-VERCEL.vercel.app` |

---

## 6. Como Conectar Sua Conta Google no Sistema

1. Abra o sistema no navegador (na Vercel ou localmente).
2. Acesse o menu lateral em **Importação** (ou **Configurações → Google Agenda**).
3. Na seção **Google Agenda**, você verá o estado: `Google Agenda desconectado`.
4. Clique no botão **CONECTAR CONTA GOOGLE**.
5. Faça login com a sua conta do Google e autorize o acesso à agenda.
6. Você será redirecionado de volta para o sistema com a mensagem: `✅ Conta do Google Agenda conectada com sucesso!`.
7. O e-mail da conta autorizada será exibido.
8. Clique em **TESTAR CONEXÃO** ou **CRIAR EVENTO DE TESTE** para validar a integração de ponta a ponta.
