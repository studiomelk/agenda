# Comparador Google Drive x Pasta Local

Aplicativo em Python para comparar uma pasta local com uma pasta pública do Google Drive.
Ele mostra quais arquivos ainda faltam subir, quais existem só no Drive e quais têm o mesmo caminho com tamanhos diferentes.

O cálculo de tamanho usa o mesmo padrão visual do Windows Explorer: base 1024 com rótulos KB, MB e GB.

## O que o aplicativo faz

1. Lê recursivamente todos os arquivos da pasta local.
2. Lê recursivamente a estrutura da pasta pública do Google Drive informada por link.
3. Consulta o tamanho dos arquivos do Drive sem baixar o arquivo inteiro sempre que possível.
4. Compara os arquivos pelo caminho relativo e pelo tamanho em bytes.
5. Gera relatórios CSV para abrir no Excel.

## Requisitos

- Python 3.10 ou superior.
- A pasta do Google Drive precisa estar compartilhada como **qualquer pessoa com o link pode visualizar**.
- Internet disponível para consultar o Google Drive.

## Instalação

No Windows, abra o PowerShell na pasta deste projeto e rode:

```powershell
py -m pip install -e .
```

Se o comando `py` não existir, tente:

```powershell
python -m pip install -e .
```

## Uso com interface gráfica

Depois de instalar, rode:

```powershell
drive-folder-compare-gui
```

Processo recomendado:

1. Cole o link da pasta do Google Drive.
2. Clique em **Escolher...** e selecione a pasta local.
3. Escolha onde salvar os relatórios.
4. Clique em **Comparar**.
5. Ao terminar, abra os CSVs gerados.

## Uso pela linha de comando

Exemplo:

```powershell
drive-folder-compare `
  --drive-link "https://drive.google.com/drive/folders/ID_DA_PASTA" `
  --local-folder "D:\00 MTS VIDEOS\2026\Bárbara e Rodrigo" `
  --output "$env:USERPROFILE\Desktop\relatorio_barbara_rodrigo"
```

No Linux/macOS, use barras normais e quebras de linha com `\`:

```bash
drive-folder-compare \
  --drive-link "https://drive.google.com/drive/folders/ID_DA_PASTA" \
  --local-folder "/caminho/para/pasta" \
  --output "./relatorio"
```

## Relatórios gerados

O aplicativo gera quatro arquivos CSV:

| Arquivo | Conteúdo |
| --- | --- |
| `faltam_subir_para_drive.csv` | Arquivos que existem na pasta local, mas não existem no Drive. |
| `existem_so_no_drive.csv` | Arquivos que existem no Drive, mas não existem na pasta local. |
| `tamanho_diferente.csv` | Arquivos com mesmo caminho, mas tamanho em bytes diferente. |
| `arquivos_ok.csv` | Arquivos encontrados nos dois lugares com o mesmo tamanho. |

## Como interpretar

- Se `faltam_subir_para_drive.csv` tiver linhas, esses são os arquivos que você deve enviar para o Google Drive.
- Se `tamanho_diferente.csv` tiver linhas, reenvie esses arquivos ou confira se houve edição local depois do upload.
- Arquivos `._nome_do_arquivo` normalmente são metadados criados por macOS e geralmente não são necessários para vídeo/foto.

## Limitações

- O aplicativo usa páginas públicas do Google Drive. Pastas privadas ou restritas não podem ser lidas sem autenticação.
- Google Docs/Sheets/Slides podem não ter um tamanho de download simples como arquivos comuns.
- O campo “tamanho em disco” do Windows não é calculado, pois depende do sistema de arquivos local. O aplicativo compara tamanho real em bytes.
