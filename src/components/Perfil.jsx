import { useRef, useState } from "react"
import Backup from "./Backup"
import Icone from "./Icone"
import ConfirmarAcao from "./ConfirmarAcao"
import BloqueioConfig from "./BloqueioConfig"
import {
  LIMITE_NOME_PERFIL,
  PALAVRA_EXCLUIR,
  confirmouExclusao,
  iniciais,
  membroDesde,
  nomeDoProvedor,
  resumoDaConta,
  usaSenha
} from "../utils/perfil"
import { brl } from "../utils/formatar"

function Interruptor({ ligado, onAlternar, titulo, texto }) {
  return (
    <label className="perfil-pref">
      <span>
        <strong>{titulo}</strong>
        <small>{texto}</small>
      </span>

      <input type="checkbox" role="switch" className="perfil-switch" checked={ligado} onChange={onAlternar} />
    </label>
  )
}

// Perfil: dados da conta, preferências deste aparelho, backup e segurança.
function Perfil({
  usuario, versao, dados, foto, onTrocarFoto, onRemoverFoto,
  modoEscuro, onModoEscuro, iniciarPrivado, onIniciarPrivado, modoLeve, onModoLeve, bloqueio, onAviso,
  onSalvarNome, onEnviarRedefinicao, onSair, onExcluirConta,
  onExportarBackup, onImportarBackup
}) {

  const inputFoto = useRef(null)
  const [nome, setNome] = useState(usuario.displayName || "")
  const [mensagem, setMensagem] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [palavra, setPalavra] = useState("")
  const [senha, setSenha] = useState("")
  const [erroExclusao, setErroExclusao] = useState("")
  const [apagando, setApagando] = useState(false)

  const imagem = foto || usuario.photoURL
  const porSenha = usaSenha(usuario.providerData)
  const resumo = resumoDaConta(dados)
  const desde = membroDesde(usuario.metadata?.creationTime)

  async function salvarNome(evento) {
    evento.preventDefault()

    const erro = await onSalvarNome(nome)
    setMensagem(erro ? { tipo: "erro", texto: erro } : { tipo: "ok", texto: "Nome atualizado." })
  }

  async function enviarRedefinicao() {
    const erro = await onEnviarRedefinicao()

    setMensagem(
      erro
        ? { tipo: "erro", texto: erro }
        : { tipo: "ok", texto: `Enviamos um e-mail para ${usuario.email} com o link para trocar a senha.` }
    )
  }

  function abrirExclusao() {
    setPalavra("")
    setSenha("")
    setErroExclusao("")
    setExcluindo(true)
  }

  async function confirmarExclusao() {
    if (apagando) {
      return
    }

    if (!confirmouExclusao(palavra)) {
      setErroExclusao(`Digite ${PALAVRA_EXCLUIR} para confirmar.`)
      return
    }

    setApagando(true)
    setErroExclusao("")

    const erro = await onExcluirConta(senha)

    // Se deu certo a página recarrega; só chegamos aqui em caso de erro
    setApagando(false)

    if (erro) {
      setErroExclusao(erro)
    }
  }

  return (
    <section className="perfil">

      <h2 className="titulo-secao">Perfil</h2>

      <div className="perfil-hero">
        <div className="perfil-foto-area">
          <button
            type="button"
            className="perfil-foto-botao"
            onClick={() => inputFoto.current?.click()}
            aria-label="Alterar foto de perfil"
            title="Alterar foto"
          >
            {imagem ? (
              <img className="perfil-foto" src={imagem} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="perfil-foto perfil-iniciais" aria-hidden="true">
                {iniciais(usuario.displayName, usuario.email)}
              </span>
            )}

            <span className="perfil-foto-camera" aria-hidden="true"><Icone nome="camera" tamanho={16} /></span>
          </button>

          <input
            ref={inputFoto}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              const arquivo = e.target.files?.[0]
              e.target.value = ""

              if (arquivo) {
                onTrocarFoto(arquivo)
              }
            }}
          />
        </div>

        <div className="perfil-quem">
          <strong>{usuario.displayName || "Sem nome"}</strong>
          <small>{usuario.email}</small>
          <span className="perfil-chip">
            {nomeDoProvedor(usuario.providerData)}
            {desde && ` · membro desde ${desde}`}
          </span>

          <span className="perfil-foto-acoes">
            <button type="button" onClick={() => inputFoto.current?.click()}>
              {foto ? "Trocar foto" : "Adicionar foto"}
            </button>

            {foto && <button type="button" onClick={onRemoverFoto}>Remover</button>}
          </span>
        </div>
      </div>

      <form className="perfil-bloco" onSubmit={salvarNome}>
        <h3>Nome de exibição</h3>

        <div className="perfil-linha">
          <input
            type="text"
            value={nome}
            maxLength={LIMITE_NOME_PERFIL}
            aria-label="Nome de exibição"
            onChange={(e) => { setNome(e.target.value.slice(0, LIMITE_NOME_PERFIL)); setMensagem(null) }}
          />

          <button type="submit" className="btn-salvar">Salvar</button>
        </div>
      </form>

      {mensagem && (
        <p className={mensagem.tipo === "erro" ? "gc-erro" : "perfil-ok"} role={mensagem.tipo === "erro" ? "alert" : "status"}>
          {mensagem.texto}
        </p>
      )}

      <div className="perfil-bloco">
        <h3>Preferências</h3>
        <p className="perfil-nota">Valem só para este aparelho.</p>

        <Interruptor
          ligado={modoEscuro}
          onAlternar={onModoEscuro}
          titulo="Modo escuro"
          texto="Tema escuro em todo o app."
        />

        <Interruptor
          ligado={modoLeve}
          onAlternar={onModoLeve}
          titulo="Modo leve"
          texto="Desliga animações e efeitos. Ajuda em aparelhos mais fracos e em quem se incomoda com movimento."
        />

        <Interruptor
          ligado={iniciarPrivado}
          onAlternar={onIniciarPrivado}
          titulo="Começar com valores escondidos"
          texto="Ao abrir o app, os valores aparecem borrados até você tocar no olho."
        />
      </div>

      <div className="perfil-bloco">
        <h3>Resumo da conta</h3>

        <dl className="perfil-resumo">
          <div><dt>Transações</dt><dd>{resumo.transacoes}</dd></div>
          <div><dt>Guardado em caixinhas</dt><dd className="valor-privado">{brl(resumo.guardado)}</dd></div>
          <div><dt>Caixinhas</dt><dd>{resumo.caixinhas}</dd></div>
          <div><dt>Contas</dt><dd>{resumo.contas}</dd></div>
          <div><dt>Cartões</dt><dd>{resumo.cartoes}</dd></div>
          <div><dt>Dívidas em aberto</dt><dd>{resumo.dividasAbertas}</dd></div>
        </dl>
      </div>

      <Backup onExportar={onExportarBackup} onImportar={onImportarBackup} />

      {bloqueio && <BloqueioConfig b={bloqueio} onAviso={onAviso} />}

      <div className="perfil-bloco">
        <h3>Segurança</h3>

        <div className="perfil-acoes">
          {porSenha && (
            <button type="button" className="btn-exportar" onClick={enviarRedefinicao}>
              Trocar senha por e-mail
            </button>
          )}

          <button type="button" className="btn-exportar" onClick={onSair}>
            Sair da conta
          </button>
        </div>
      </div>

      <div className="perfil-bloco perigo">
        <h3>Zona de risco</h3>

        <p className="perfil-nota">
          Exclui sua conta e apaga todos os seus dados da nuvem e deste aparelho. Não dá para desfazer.
          Faça um backup antes, se quiser guardar uma cópia.
        </p>

        <button type="button" className="btn-excluir-conta" onClick={abrirExclusao}>
          Excluir minha conta e meus dados
        </button>
      </div>

      <p className="perfil-versao">Controle Financeiro · versão {versao}</p>

      {excluindo && (
        <ConfirmarAcao
          titulo="Excluir conta?"
          textoConfirmar={apagando ? "Excluindo..." : "Excluir tudo"}
          perigo
          onConfirmar={confirmarExclusao}
          onCancelar={() => { if (!apagando) setExcluindo(false) }}
        >
          <p>
            Todas as suas transações, caixinhas, contas, cartões e dívidas serão apagadas
            para sempre, e seu login será removido.
          </p>

          <label className="perfil-confirma">
            Digite <strong>{PALAVRA_EXCLUIR}</strong> para confirmar
            <input
              type="text"
              value={palavra}
              autoComplete="off"
              onChange={(e) => { setPalavra(e.target.value); setErroExclusao("") }}
            />
          </label>

          {porSenha ? (
            <label className="perfil-confirma">
              Sua senha
              <input
                type="password"
                value={senha}
                autoComplete="current-password"
                onChange={(e) => { setSenha(e.target.value); setErroExclusao("") }}
              />
            </label>
          ) : (
            <p className="perfil-nota">Vamos pedir para você confirmar com o Google.</p>
          )}

          {erroExclusao && <p className="gc-erro" role="alert">{erroExclusao}</p>}
        </ConfirmarAcao>
      )}

    </section>
  )
}

export default Perfil
