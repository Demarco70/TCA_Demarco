-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.area_direito (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome text NOT NULL UNIQUE,
  CONSTRAINT area_direito_pkey PRIMARY KEY (id)
);
CREATE TABLE public.checklist (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome text NOT NULL,
  area_direito_id bigint,
  tipo_demanda text,
  ativo boolean NOT NULL,
  criado_em timestamp with time zone NOT NULL,
  CONSTRAINT checklist_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_area_direito_id_fkey FOREIGN KEY (area_direito_id) REFERENCES public.area_direito(id)
);
CREATE TABLE public.checklist_processo (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  processo_id bigint NOT NULL,
  checklist_id bigint,
  nome text NOT NULL,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT checklist_processo_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_processo_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processo(id),
  CONSTRAINT checklist_processo_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.checklist(id)
);
CREATE TABLE public.cliente (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  pessoa_id bigint NOT NULL UNIQUE,
  data_cadastro date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT '''ativo''::text'::text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cliente_pkey PRIMARY KEY (id),
  CONSTRAINT cliente_pessoa_id_fkey FOREIGN KEY (pessoa_id) REFERENCES public.pessoa(id)
);
CREATE TABLE public.compromisso (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  processo_id bigint NOT NULL,
  titulo text NOT NULL,
  descricao text,
  inicio timestamp with time zone NOT NULL,
  fim timestamp with time zone,
  local text,
  responsavel_id bigint,
  CONSTRAINT compromisso_pkey PRIMARY KEY (id),
  CONSTRAINT compromisso_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processo(id),
  CONSTRAINT compromisso_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.processo_responsavel(id)
);
CREATE TABLE public.documento (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  processo_id bigint NOT NULL,
  titulo text NOT NULL,
  tipo text,
  data_recebimento date,
  status_recebido boolean NOT NULL DEFAULT false,
  status_conferido boolean NOT NULL DEFAULT false,
  caminho_arquivo text,
  criado_por bigint,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT documento_pkey PRIMARY KEY (id),
  CONSTRAINT documento_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processo(id),
  CONSTRAINT documento_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.usuario(id)
);
CREATE TABLE public.endereco (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  cep text NOT NULL,
  rua text,
  numero text,
  complemento text,
  cidade text,
  estado text,
  pais text NOT NULL DEFAULT '''Brasil''::text'::text,
  CONSTRAINT endereco_pkey PRIMARY KEY (id)
);
CREATE TABLE public.item_checklist (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  checklist_id bigint NOT NULL,
  descricao text NOT NULL,
  ordem integer NOT NULL,
  CONSTRAINT item_checklist_pkey PRIMARY KEY (id),
  CONSTRAINT item_checklist_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.checklist(id)
);
CREATE TABLE public.item_checklist_processo (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  checklist_processo_id bigint NOT NULL,
  item_checklist_id bigint,
  descricao text NOT NULL,
  status text NOT NULL,
  documento_id bigint,
  observacoes text,
  atualizado_por bigint,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT item_checklist_processo_pkey PRIMARY KEY (id),
  CONSTRAINT item_checklist_processo_checklist_processo_id_fkey FOREIGN KEY (checklist_processo_id) REFERENCES public.checklist_processo(id),
  CONSTRAINT item_checklist_processo_item_checklist_id_fkey FOREIGN KEY (item_checklist_id) REFERENCES public.item_checklist(id),
  CONSTRAINT item_checklist_processo_atualizado_por_fkey FOREIGN KEY (atualizado_por) REFERENCES public.usuario(id),
  CONSTRAINT item_checklist_processo_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documento(id)
);
CREATE TABLE public.pessoa (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome text NOT NULL,
  email text,
  telefone text,
  cpf text UNIQUE,
  cnpj text UNIQUE,
  data_nascimento date,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pessoa_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pessoa_endereco (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  pessoa_id bigint NOT NULL,
  endereco_id bigint NOT NULL,
  tipo text NOT NULL DEFAULT '''''''residencial''''::text''''''::text'::text,
  CONSTRAINT pessoa_endereco_pkey PRIMARY KEY (id),
  CONSTRAINT pessoa_endereco_pessoa_id_fkey FOREIGN KEY (pessoa_id) REFERENCES public.pessoa(id),
  CONSTRAINT pessoa_endereco_endereco_id_fkey FOREIGN KEY (endereco_id) REFERENCES public.endereco(id)
);
CREATE TABLE public.processo (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  codigo text UNIQUE,
  titulo text NOT NULL,
  descricao text,
  area_direito_id bigint,
  tipo_demanda text,
  status text NOT NULL DEFAULT '''ativo''::text'::text,
  data_inicio date,
  cliente_id bigint NOT NULL,
  criado_por bigint,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT processo_pkey PRIMARY KEY (id),
  CONSTRAINT processo_area_direito_id_fkey FOREIGN KEY (area_direito_id) REFERENCES public.area_direito(id),
  CONSTRAINT processo_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id),
  CONSTRAINT processo_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.usuario(id)
);
CREATE TABLE public.processo_parte (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  processo_id bigint NOT NULL,
  pessoa_id bigint NOT NULL,
  papel text NOT NULL,
  observacoes text,
  CONSTRAINT processo_parte_pkey PRIMARY KEY (id),
  CONSTRAINT processo_parte_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processo(id),
  CONSTRAINT processo_parte_pessoa_id_fkey FOREIGN KEY (pessoa_id) REFERENCES public.pessoa(id)
);
CREATE TABLE public.processo_responsavel (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  processo_id bigint NOT NULL,
  usuario_id bigint NOT NULL,
  funcao text NOT NULL,
  CONSTRAINT processo_responsavel_pkey PRIMARY KEY (id),
  CONSTRAINT processo_responcavel_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processo(id),
  CONSTRAINT processo_responcavel_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(id)
);
CREATE TABLE public.resumo_documento (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  documento_id bigint NOT NULL UNIQUE,
  texto text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT resumo_documento_pkey PRIMARY KEY (id),
  CONSTRAINT resumo_documento_documento_id_fkey FOREIGN KEY (documento_id) REFERENCES public.documento(id)
);
CREATE TABLE public.tarefa (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  processo_id bigint NOT NULL,
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT '''tarefa''::text'::text,
  prioridade text NOT NULL DEFAULT '''media''::text'::text,
  status text NOT NULL DEFAULT '''pendente''::text'::text,
  data_limite date,
  concluida_em date,
  responsavel_id bigint,
  criado_por bigint,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tarefa_pkey PRIMARY KEY (id),
  CONSTRAINT tarefa_processo_id_fkey FOREIGN KEY (processo_id) REFERENCES public.processo(id),
  CONSTRAINT tarefa_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.processo_responsavel(id),
  CONSTRAINT tarefa_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.usuario(id)
);
CREATE TABLE public.usuario (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  pessoa_id bigint UNIQUE,
  auth_user_id uuid UNIQUE,
  nome_exibicao text NOT NULL,
  cargo text,
  ativo boolean NOT NULL,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT usuario_pkey PRIMARY KEY (id),
  CONSTRAINT usuario_pessoa_id_fkey FOREIGN KEY (pessoa_id) REFERENCES public.pessoa(id),
  CONSTRAINT usuario_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);
