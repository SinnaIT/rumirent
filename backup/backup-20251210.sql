--
-- PostgreSQL database dump
--

\restrict RF5TACuA8yO3PdqRULBB19fpzEhPb4OjrUonalpbG4GEMNILW4fJvDy5d0LIcr9

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: EstadoLead; Type: TYPE; Schema: public; Owner: rumirent_prod
--

CREATE TYPE public."EstadoLead" AS ENUM (
    'ENTREGADO',
    'RESERVA_PAGADA',
    'APROBADO',
    'RECHAZADO'
);


ALTER TYPE public."EstadoLead" OWNER TO rumirent_prod;

--
-- Name: EstadoUnidad; Type: TYPE; Schema: public; Owner: rumirent_prod
--

CREATE TYPE public."EstadoUnidad" AS ENUM (
    'DISPONIBLE',
    'RESERVADA',
    'VENDIDA'
);


ALTER TYPE public."EstadoUnidad" OWNER TO rumirent_prod;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: rumirent_prod
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'BROKER'
);


ALTER TYPE public."Role" OWNER TO rumirent_prod;

--
-- Name: TipoIcono; Type: TYPE; Schema: public; Owner: rumirent_prod
--

CREATE TYPE public."TipoIcono" AS ENUM (
    'LUCIDE',
    'URL',
    'UPLOAD'
);


ALTER TYPE public."TipoIcono" OWNER TO rumirent_prod;

--
-- Name: TipoImagenUrl; Type: TYPE; Schema: public; Owner: rumirent_prod
--

CREATE TYPE public."TipoImagenUrl" AS ENUM (
    'URL',
    'UPLOAD'
);


ALTER TYPE public."TipoImagenUrl" OWNER TO rumirent_prod;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO rumirent_prod;

--
-- Name: cambios_comision_programados; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.cambios_comision_programados (
    id text NOT NULL,
    "fechaCambio" timestamp(3) without time zone NOT NULL,
    "comisionId" text NOT NULL,
    "edificioId" text NOT NULL,
    "tipoUnidadEdificioId" text,
    ejecutado boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cambios_comision_programados OWNER TO rumirent_prod;

--
-- Name: caracteristicas_edificio; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.caracteristicas_edificio (
    id text NOT NULL,
    "edificioId" text NOT NULL,
    "tipoCaracteristicaId" text NOT NULL,
    nombre text NOT NULL,
    valor text NOT NULL,
    "mostrarEnResumen" boolean DEFAULT true NOT NULL,
    icono text,
    "tipoIcono" public."TipoIcono" DEFAULT 'LUCIDE'::public."TipoIcono" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.caracteristicas_edificio OWNER TO rumirent_prod;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.clientes (
    id text NOT NULL,
    nombre text NOT NULL,
    rut text NOT NULL,
    email text,
    telefono text,
    "brokerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    direccion text,
    "fechaNacimiento" timestamp(3) without time zone
);


ALTER TABLE public.clientes OWNER TO rumirent_prod;

--
-- Name: comisiones; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.comisiones (
    id text NOT NULL,
    nombre text NOT NULL,
    codigo text NOT NULL,
    porcentaje double precision NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.comisiones OWNER TO rumirent_prod;

--
-- Name: edificios; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.edificios (
    id text NOT NULL,
    nombre text NOT NULL,
    direccion text NOT NULL,
    descripcion text,
    "comisionId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    email text,
    "empresaId" text NOT NULL,
    telefono text,
    "urlGoogleMaps" text,
    ciudad text NOT NULL,
    "codigoPostal" text,
    comuna text NOT NULL,
    region text NOT NULL
);


ALTER TABLE public.edificios OWNER TO rumirent_prod;

--
-- Name: empresas; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.empresas (
    id text NOT NULL,
    nombre text NOT NULL,
    rut text NOT NULL,
    "razonSocial" text NOT NULL,
    direccion text,
    telefono text,
    email text,
    activa boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.empresas OWNER TO rumirent_prod;

--
-- Name: imagenes_edificio; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.imagenes_edificio (
    id text NOT NULL,
    "edificioId" text NOT NULL,
    url text NOT NULL,
    descripcion text,
    orden integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "imageType" public."TipoImagenUrl" DEFAULT 'URL'::public."TipoImagenUrl" NOT NULL
);


ALTER TABLE public.imagenes_edificio OWNER TO rumirent_prod;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.leads (
    id text NOT NULL,
    "codigoUnidad" text,
    "totalLead" double precision NOT NULL,
    "montoUf" double precision,
    comision double precision NOT NULL,
    estado public."EstadoLead" DEFAULT 'ENTREGADO'::public."EstadoLead" NOT NULL,
    "fechaPagoReserva" timestamp(3) without time zone,
    "fechaPagoLead" timestamp(3) without time zone,
    "fechaCheckin" timestamp(3) without time zone,
    postulacion text,
    observaciones text,
    conciliado boolean DEFAULT false NOT NULL,
    "fechaConciliacion" timestamp(3) without time zone,
    "reglaComisionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "brokerId" text NOT NULL,
    "clienteId" text NOT NULL,
    "unidadId" text,
    "edificioId" text NOT NULL,
    "comisionId" text,
    "tipoUnidadEdificioId" text
);


ALTER TABLE public.leads OWNER TO rumirent_prod;

--
-- Name: metas_mensuales; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.metas_mensuales (
    id text NOT NULL,
    "brokerId" text,
    mes integer NOT NULL,
    anio integer NOT NULL,
    "montoMeta" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.metas_mensuales OWNER TO rumirent_prod;

--
-- Name: reglas_comision; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.reglas_comision (
    id text NOT NULL,
    "cantidadMinima" double precision NOT NULL,
    "cantidadMaxima" double precision,
    porcentaje double precision NOT NULL,
    "comisionId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.reglas_comision OWNER TO rumirent_prod;

--
-- Name: tipos_caracteristica; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.tipos_caracteristica (
    id text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tipos_caracteristica OWNER TO rumirent_prod;

--
-- Name: tipos_unidad_edificio; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.tipos_unidad_edificio (
    id text NOT NULL,
    nombre text NOT NULL,
    codigo text NOT NULL,
    "comisionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "edificioId" text NOT NULL,
    bathrooms integer,
    bedrooms integer
);


ALTER TABLE public.tipos_unidad_edificio OWNER TO rumirent_prod;

--
-- Name: unidades; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.unidades (
    id text NOT NULL,
    numero text NOT NULL,
    estado public."EstadoUnidad" DEFAULT 'DISPONIBLE'::public."EstadoUnidad" NOT NULL,
    descripcion text,
    metros2 double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "edificioId" text NOT NULL,
    "tipoUnidadEdificioId" text NOT NULL
);


ALTER TABLE public.unidades OWNER TO rumirent_prod;

--
-- Name: users; Type: TABLE; Schema: public; Owner: rumirent_prod
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    nombre text NOT NULL,
    rut text NOT NULL,
    telefono text,
    role public."Role" DEFAULT 'BROKER'::public."Role" NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "birthDate" timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO rumirent_prod;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
4a666a5e-ed3c-4ed4-b623-6420df0fa181	4543ed1092b5d05709e5e1a1df43b79eda497e67e1b0d2ca6e3099c7c149d5df	2025-11-06 02:08:04.731108+00	20250924201153_init_with_optional_commission	\N	\N	2025-11-06 02:08:04.468066+00	1
f12d7daf-11c0-4eb6-ad33-bf5b4df87a12	e568e8c3ed83685c72c92b619a6172fb73396e5cdd233e84a5767096419c675c	2025-11-06 02:08:04.832781+00	20251022140456_add_edificio_mejoras_completas	\N	\N	2025-11-06 02:08:04.734583+00	1
7d131f32-645e-4d0f-9fee-7be51182e64e	7617a547ee0e3f7b9f156b6b36c359ee27666fe40559630297f2e0f66dcbddc8	2025-11-06 02:08:04.872446+00	20251023183046_add_metas_mensuales	\N	\N	2025-11-06 02:08:04.836349+00	1
816bdaaf-d294-4d45-8dc9-2c7d456e0d4e	781f157602c2ae9672e6d67cdaabbbe7ba6289beb202c934e1b4741a06a858a6	2025-11-06 02:08:04.887036+00	20251023190700_make_broker_id_optional_in_metas	\N	\N	2025-11-06 02:08:04.875342+00	1
787e4884-dd35-4e7c-bcc2-0393afbeaaea	7458a724abb66a0e19aa79a0fb7f0c5f8053bb3118af74f886f47dbd7d1d364a	2025-11-06 02:08:04.899521+00	20251023190919_add_user_birth_date	\N	\N	2025-11-06 02:08:04.890087+00	1
7cd96022-568e-4b44-8fae-d15f1c0dc01e	04913c67d029f73caef3708179ae47f9783d9823808584227e8ef7f588a81d83	2025-11-06 02:08:04.908758+00	20251023233728_add_bedrooms_bathrooms_to_tipo_unidad	\N	\N	2025-11-06 02:08:04.90199+00	1
97166a9b-a23e-41ec-85d2-224d334672b6	7448d7b7a5a429bde2d66e4efd132dec3dc39721b50132e31f0ef15cf1473e41	2025-11-06 02:08:04.919558+00	20251024111244_add_image_type_to_imagenes	\N	\N	2025-11-06 02:08:04.910902+00	1
c36afa48-56c5-4341-8a19-182bee2c3393	605fcff496a2fc2e7235a5eb94a16be05b4d0d3aa09bda24d3f348fc7a56b2c4	2025-11-06 02:08:04.937613+00	20251026150104_add_address_fields_to_edificio	\N	\N	2025-11-06 02:08:04.921821+00	1
b0756e3b-acba-445d-a769-7aa31c1f6f5f	b8c46b4d3905f2eb95ea6d08bc2cde5baa74b4f4356c815527fb64c0ec1310da	2025-11-06 02:08:04.952775+00	20251026202147_make_broker_optional_in_cliente	\N	\N	2025-11-06 02:08:04.939475+00	1
\.


--
-- Data for Name: cambios_comision_programados; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.cambios_comision_programados (id, "fechaCambio", "comisionId", "edificioId", "tipoUnidadEdificioId", ejecutado, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: caracteristicas_edificio; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.caracteristicas_edificio (id, "edificioId", "tipoCaracteristicaId", nombre, valor, "mostrarEnResumen", icono, "tipoIcono", "createdAt", "updatedAt") FROM stdin;
cmho7gsik004rnu016g26e6p1	cmho6hrs40046nu01bfsc5q74	cmho7ecax004pnu01psghtw4u	Gimnasio	Libre	t	Dumbbell	LUCIDE	2025-11-07 01:57:18.813	2025-11-07 01:57:18.813
cmhy8vbid00hsnu015abm6ozr	cmhqm00ye00atnu01jp66tctg	cmho7ecax004pnu01psghtw4u	GYM	S/C	t	Dumbbell	LUCIDE	2025-11-14 02:34:17.989	2025-11-14 02:34:17.989
cmhy920in00hznu0190uh2ge8	cmhqm00ye00atnu01jp66tctg	cmhy90ijr00hxnu01lqzszy4t	Piscina	S/C	t	Sun	LUCIDE	2025-11-14 02:39:30.335	2025-11-14 02:39:30.335
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.clientes (id, nombre, rut, email, telefono, "brokerId", "createdAt", "updatedAt", direccion, "fechaNacimiento") FROM stdin;
cmho8styh0059nu01rssg4kt2	Manuel Alejandro Soto Briceno	16062175-3	manuelsotobriceno@gmail.com	+56 9 2608 5935	cmhnp489x0000nu01bdxkfmd1	2025-11-07 02:34:40.169	2025-11-07 02:37:16.155	Escanilla 1035, Departamento 1315-A, Independencia	1985-06-28 00:00:00
cmi0vhf6i00janu012s30eser	Mariana Antonia Mirzai Hernandez	21.577.150-4	marianamirzai76@gmail.com	+56 940505013	cmhnp489x0000nu01bdxkfmd1	2025-11-15 22:42:53.082	2025-11-15 22:42:53.082	\N	\N
cmhp3s1y3005wnu010pv6qrhg	Yolexis Del Carmen Guerrero Lozada	26.251.315-7	guerreroyolexis25@gmail.com	+56 9 4569 7419	cmhp20l9y005gnu01lxalm8ri	2025-11-07 17:01:51.963	2025-11-07 17:01:51.963	\N	\N
cmhp435kf0060nu010z4txe0x	Danitza Andrea Del Campo Quintana	20.945.245-6	danitzadelcampo0101@gmail.com	+56954137707	cmhp20l9y005gnu01lxalm8ri	2025-11-07 17:10:29.871	2025-11-07 17:10:29.871	\N	\N
cmhp4d7te0064nu01k9m0po7b	Alexis Alejandro Chavez Infante	16.718.795-1	alexisc.hxc@gmail.com	+56 9 6309 0279	cmhp20l9y005gnu01lxalm8ri	2025-11-07 17:18:19.346	2025-11-07 17:18:19.346	\N	\N
cmhp7gh4k006enu01z3nes0o1	Yadira Feliza Bastidas Hurtado	28.607.888-5	fb069435@gmail.com	+56 9 7428 4581	cmhp20l9y005gnu01lxalm8ri	2025-11-07 18:44:50.228	2025-11-07 18:44:50.228	\N	\N
cmhqgqtj40096nu011hct2zkj	GABRIEL ALESHANDRE VEGA GOMEZ	19.545.286-5	v.gomez.aleshandre@gmail.com	+56 9 7194 2595	cmhqfwbvr0092nu01dhx88gr5	2025-11-08 15:52:35.584	2025-11-08 15:57:18.416	Pudeto 6908	1996-12-28 00:00:00
cmhtfwydk00aznu014tbf3cxa	Jorge Fabián Muñoz Cotrina	27.634.705-5	jofamuco98.cl@gmail.com	+56 9 3742 7353	cmhqfwbvr0092nu01dhx88gr5	2025-11-10 17:52:40.712	2025-11-10 17:52:40.712	\N	\N
cmhu0v1w400bbnu01v7pxj58d	Aleyda Claribel Peralta Guzman	23.944.077-0	laclari115@hotmail.com	+56 9 9241 1272	cmhnp489x0000nu01bdxkfmd1	2025-11-11 03:39:03.892	2025-11-11 03:39:03.892	\N	\N
cmhuhbd9p00bfnu01a9wtkv0z	ANDRES EMANUEL GONZALEZ	19.203.704-2	bullandres2910@gmail.com	+56 9 3596 4459	cmhnp489x0000nu01bdxkfmd1	2025-11-11 11:19:38.989	2025-11-11 11:19:38.989	\N	\N
cmhui8aq000bnnu015ahit8pb	GABRIEL JOSE RAMOS ZAPATA	27.432.770-7	pablojose1406@gmail.com	+56 9 3681 6267	cmhp20l9y005gnu01lxalm8ri	2025-11-11 11:45:15.337	2025-11-11 11:45:15.337	\N	\N
cmhuwvlko00btnu015ailm5fw	Paula Andrea Sotelo Munoz	20239362-4	pau.sotelo99@gmail.com	+56 9 9580 6155	cmhp20l9y005gnu01lxalm8ri	2025-11-11 18:35:17.112	2025-11-11 18:35:17.112	\N	\N
cmhwbaz1j00bxnu01hzf8p5ov	Nicolas adrian miranda aravena	18.670.019-8	nidamafeso@gmail.com	+56 921108080	cmhnp489x0000nu01bdxkfmd1	2025-11-12 18:06:55.207	2025-11-12 18:06:55.207	\N	\N
cmhxsclme00c5nu01pdo5zdzk	William Alberto Salas Fonseca	28.529.443-6	willifonseca9@gmail.com	+56 9 2622 5955	cmhnpclzs0001nu01fuix77i5	2025-11-13 18:51:50.774	2025-11-13 18:51:50.774	\N	\N
cmhxsncl700cdnu0139sjyvax	Jose Andres Escobar Munoz	21.383.774-5	jose.aem62@gmail.com	+56 9 2399 9835	cmhnpclzs0001nu01fuix77i5	2025-11-13 19:00:12.283	2025-11-13 19:00:12.283	\N	\N
cmhxst49900clnu01m4qdhs6p	Ana Cecilia Aragon Carvajal	12.058.475-8	anaaragon37@gmail.com	+56 9 8197 1644	cmhnpclzs0001nu01fuix77i5	2025-11-13 19:04:41.421	2025-11-13 19:04:41.421	\N	\N
cmhxt1b7900ctnu01uyzdbgkg	Yesid Cabrera Arias	26.414.627-5	yesidcabreraarias91@gmail.com	+56 9 4490 3698	cmhnpclzs0001nu01fuix77i5	2025-11-13 19:11:03.669	2025-11-13 19:11:03.669	\N	\N
cmhxt7mgy00d1nu01yzgs84m6	Vicente Amaro Rosales Zambrano	26.817.729-9	vicenterosale1@gmail.com	+56 9 5821 3956	cmhnpclzs0001nu01fuix77i5	2025-11-13 19:15:58.21	2025-11-13 19:15:58.21	\N	\N
cmhxus4yg00danu01v07l8hmc	Genesis Belen Rivas Donoso	20.574.405-3	rivasdonosogenesisbelen@gmail.com	+56 9 7915 9631	cmhnp489x0000nu01bdxkfmd1	2025-11-13 19:59:54.904	2025-11-13 19:59:54.904	\N	\N
cmhxvlkof00dknu01dvg546gg	Jaime Isaias Rivas Rojas	20.830.522-0	rivasrojasisaias@gmail.com	+56 9 4652 2154	cmhnvdsvv002lnu01prp9jh1k	2025-11-13 20:22:48.303	2025-11-13 20:22:48.303	\N	\N
cmhxvsfo300donu01pb8b7ruy	Miguel Alexis Caceres Manquian	17.283.092-7	mcacere8@gmail.com	+56 9 3436 8152	cmhnvdsvv002lnu01prp9jh1k	2025-11-13 20:28:08.403	2025-11-13 20:28:08.403	\N	\N
cmhxvyz9n00dsnu011cqsibnq	Raul Alfredo Bonilla Aedo	9.535.864-0	raul_bonilla_52@hotmail.com	+56 9 3429 0522	cmhnvdsvv002lnu01prp9jh1k	2025-11-13 20:33:13.74	2025-11-13 20:33:13.74	\N	\N
cmhy0s5qu00einu018q5hteej	Ana Beatriz Almeida Lana	27.123.156-3	anabeatrizlanaaa@gmail.com	+56 9 2621 2770	cmhqfovpd0091nu01mww6odbc	2025-11-13 22:47:53.622	2025-11-13 22:47:53.622	\N	\N
cmhy0w29i00emnu01gd5iu2r2	Amalia Andrea Neira Chaparro	21.786.434-8	amalia.neirach962@gmail.com	+56 9 8945 5629	cmhqfovpd0091nu01mww6odbc	2025-11-13 22:50:55.734	2025-11-13 22:50:55.734	\N	\N
cmhy1jecd00f0nu01k8mdxx1v	Leonardo Matias Montesinos Riffo	18.297.179-0	leonardo_montesinosr@hotmail.com	+56 9 4592 2818	cmhqfksb1008znu01wxt3ekhx	2025-11-13 23:09:04.478	2025-11-13 23:09:04.478	\N	\N
cmhy1nlv800f4nu0192ymmvye	Rodrigo Fuentes Stiglich	16.814.624-8	rodrigofuentesstiglich@gmail.com	+56 9 6331 7816	cmhqfksb1008znu01wxt3ekhx	2025-11-13 23:12:20.852	2025-11-13 23:12:20.852	\N	\N
cmhy3idm900fynu01s2f8o0op	Jose Domingo Marin Marican	15.834.632-K	jose.marin.5700@gmail.com	+56 9 8746 0177	cmhqfmabj0090nu01fb3tkeip	2025-11-14 00:04:16.113	2025-11-14 00:04:16.113	\N	\N
cmhy3pbck00g2nu01he2rpn76	Cristian Andres Valdivia Zamorano	13.499.219-0	kristianvaldivia1978@gmail.com	+56 9 3528 6475	cmhqfmabj0090nu01fb3tkeip	2025-11-14 00:09:39.764	2025-11-14 00:09:39.764	\N	\N
cmhy3wqov00g6nu01aw8b4t88	Antonia Valentina Cubillos Acosta	22.195.498-K	acubillos312@gmail.com	+56 9 8924 0282	cmhqfmabj0090nu01fb3tkeip	2025-11-14 00:15:26.24	2025-11-14 00:15:26.24	\N	\N
cmhy41rox00ganu0147zcwmcx	Ruth Margarita Gonzalez Cortes	13.461.903-1	rgonzalez.haziel@gmail.com	+56 9 7436 7020	cmhqfmabj0090nu01fb3tkeip	2025-11-14 00:19:20.817	2025-11-14 00:19:20.817	\N	\N
cmhy46zeh00genu01q9dw3bxt	Alicia Elena Castro Ramirez	16.517.154-3	alicastrora@gmail.com	+56 9 6129 4394	cmhqfmabj0090nu01fb3tkeip	2025-11-14 00:23:24.089	2025-11-14 00:23:24.089	\N	\N
cmhy4ghv900ginu0162si4k1n	Henry David Marin Villarroel	27.697.687-7	villa17235@gmail.com	+56 9 7678 8828	cmhqfmabj0090nu01fb3tkeip	2025-11-14 00:30:47.925	2025-11-14 00:30:47.925	\N	\N
cmhy4m0it00gmnu013tusjjt8	Nelson Rodrigo Guzman Betancourt	9.859.167-2	ngb201@gmail.com	\N	cmhqfmabj0090nu01fb3tkeip	2025-11-14 00:35:05.381	2025-11-14 00:35:05.381	\N	\N
cmhy65m6d00gsnu01tlzu6okr	Michelle Alessandra Quiroz Rore	16.027.492-1	yohannyinfante975@gmail.com	+56 9 7185 9101	cmhqh4yyd009bnu01a3kogkmx	2025-11-14 01:18:19.525	2025-11-14 01:18:19.525	\N	\N
cmhy6i5wq00gynu01idxg3kzy	Emma Carolina Jerez Huerta	20.468.318-2	emajerez1@gmail.com	+56 9 2007 7091	cmhnwgqkq002qnu017iz7yc97	2025-11-14 01:28:04.971	2025-11-14 01:28:04.971	\N	\N
cmhy6ts9300h8nu01x19qrecw	Yessica Raquel Gonzalez	28.934.065-3	yessicargg@gmail.com	+56 9 2229 4378	cmhnwaeq9002pnu017u5x1dkt	2025-11-14 01:37:07.143	2025-11-14 01:37:07.143	\N	\N
cmhy6y60n00hcnu01nv72paq7	Joao Pedro Gomes Dos Anjos	28.851.780-0	joaopg16@gmail.com	+56 9 7988 4367	cmhnwaeq9002pnu017u5x1dkt	2025-11-14 01:40:31.607	2025-11-14 01:40:31.607	\N	\N
cmhy7sthe00hjnu016fpvdife	Marwis Rafael Ravelo Ugas	27.188.463-k	marwisravelochile@gmail.com	+56 9 7418 6471	cmhy7mq9v00hfnu016zkghrx0	2025-11-14 02:04:21.698	2025-11-14 02:04:21.698	\N	\N
cmhycmc0800i4nu010v7g8b5t	Vanessa Moran Vallecilla	23.926.845-5	Vanessamoran1127@gmail.com	+56 9 7900 8857	cmhqfksb1008znu01wxt3ekhx	2025-11-14 04:19:17.192	2025-11-14 04:19:17.192	\N	\N
cmhoxy0al005dnu01ba2g830s	Ana belen devia salas	19.545.161-3	adeviasalas@gmail.com	+56 998676379	cmhnp489x0000nu01bdxkfmd1	2025-11-07 14:18:32.061	2025-11-15 13:31:41.159	Arturo prat 621, depto. 604-B	\N
cmi7dtrl500jxnu01t6mx4tza	Francisco alberto chavez sotomayor	21.713.963-3	atook.23.99@gmail.com	+56 982736776	cmhnp489x0000nu01bdxkfmd1	2025-11-20 12:02:59.177	2025-11-24 10:49:15.587	\N	\N
cmi4snsvf00jenu01upopfbzu	Catalina del pilar jimenez nuñez	20.148.196-1	catalinajimenez737@gmail.com	+56 974079440	cmhnp489x0000nu01bdxkfmd1	2025-11-18 16:34:56.619	2025-11-24 23:29:52.468	Las vizcachas 3457, maipu	\N
cmiga2bp500k5nu011slj1oso	Paula Andrea Perez Perdomo	25.837.747-8	jandreaguti@gmail.com	+56945900067	cmhnp489x0000nu01bdxkfmd1	2025-11-26 17:27:35.61	2025-11-26 17:27:35.61	\N	\N
\.


--
-- Data for Name: comisiones; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.comisiones (id, nombre, codigo, porcentaje, activa, "createdAt", "updatedAt") FROM stdin;
cmhnq5mm10006nu01dhusnl3i	Regular	COM-REG	0.25	t	2025-11-06 17:52:44.473	2025-11-06 17:52:44.473
cmhnq66q90007nu018g1z5a2k	Prioridad 1	COM-P1	0.35	t	2025-11-06 17:53:10.545	2025-11-06 17:53:10.545
cmhnq6h2x0008nu016g7mjfs3	Prioridad 2	COM-P2	0.4	t	2025-11-06 17:53:23.962	2025-11-06 17:53:23.962
cmhy8gzb700hmnu01srk964hk	Prioridad 1 +4	COM-P1+4	0.37	f	2025-11-14 02:23:08.995	2025-11-14 12:53:59.247
cmhxtd8ry00d4nu013j1kpp9f	Regular +4	COM-REG+4	0.3	f	2025-11-13 19:20:20.399	2025-11-14 12:54:02.048
\.


--
-- Data for Name: edificios; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.edificios (id, nombre, direccion, descripcion, "comisionId", "createdAt", "updatedAt", email, "empresaId", telefono, "urlGoogleMaps", ciudad, "codigoPostal", comuna, region) FROM stdin;
cmhnqlv8d000inu01i46adazq	Carmen 368	Carmen 368	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:05:22.141	2025-11-06 18:05:22.141	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhntue1c0024nu01onpp6h7t	Alameda Park	Av Libertador Bernardo O'Higgins 4320	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 19:35:58.608	2025-11-06 19:35:58.608	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Estación Central	Región Metropolitana
cmhnqjiue000enu01xhibi8bs	Abdón Cifuentes 150	Abdón Cifuentes 150	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:03:32.774	2025-11-06 18:05:42.249	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnqhnl1000cnu012vk6c1q6	Sara del Campo 535	Sara del Campo 535	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:02:05.605	2025-11-06 18:05:52.189	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnqod7d000mnu01oe1eq79l	Inglaterra 59	Inglaterra 59	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:07:18.745	2025-11-06 18:07:18.745	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhnqvd7z000qnu014inrxbp6	José Ureta 180	José Ureta 180	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:12:45.359	2025-11-06 18:12:45.359	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	La Cisterna	Región Metropolitana
cmhnqwgx4000snu014paiyvsy	Juan Mitjans 105	Juan Mitjans 105	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:13:36.808	2025-11-06 18:13:36.808	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Macul	Región Metropolitana
cmhnr2iob0014nu018ictmvkt	Libertad 2726	Libertad 2726	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:18:19.019	2025-11-06 18:18:19.019	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnr3j4m0016nu018qrc8f3w	Los Avellanos 2551	Los Avellanos 2551	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:19:06.262	2025-11-06 18:19:06.262	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Ñuñoa	Región Metropolitana
cmhnr4fbf0018nu0161i7ol34	María Auxiliadora 975	María Auxiliadora 975	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:19:47.98	2025-11-06 18:19:47.98	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	San Miguel	Región Metropolitana
cmhnr5hiz001anu01ahvzcp7v	Maule 150	Maule 150	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:20:37.499	2025-11-06 18:20:37.499	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnr6hhn001cnu01883pa1l6	Morandé 924	Morandé 924	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:21:24.107	2025-11-06 18:21:24.107	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnr7oyw001enu013shvbqvs	Paso el Roble 50	Paso el Roble 50	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:22:20.456	2025-11-06 18:22:20.456	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhnr8ixt001gnu01hxg12zab	Pedro Alarcón 932	Pedro Alarcón 932	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:22:59.298	2025-11-06 18:22:59.298	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	San Miguel	Región Metropolitana
cmhnrgouf001inu01290c40kv	Placilla 76	Placilla 76	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:29:20.199	2025-11-06 18:29:20.199	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Estación Central	Región Metropolitana
cmhnriqne001mnu01ojug9wun	Quilín 3127	Av. Quilín 3127	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:30:55.85	2025-11-06 18:30:55.85	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Macul	Región Metropolitana
cmhnrluu5001onu0119832kuj	Ricardo Lyon 1171	Av. Ricardo Lyon 1171	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:33:21.245	2025-11-06 18:33:21.245	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Providencia	Región Metropolitana
cmhnrs3pe001qnu01roqgqam0	Santa Elena 2120	Av. Santa Elena 2120	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:38:12.674	2025-11-06 18:38:12.674	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnrt0lp001snu01g73xygcj	Santa Rosa 237	Av. Santa Rosa 237	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:38:55.309	2025-11-06 18:38:55.309	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnrui83001unu01roc4j57z	Santo Domingo 3251	Santo Domingo 3251	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:40:04.803	2025-11-06 18:40:04.803	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Quinta Normal	Región Metropolitana
cmhnrvjjt001wnu01f0plha8z	Tocornal 661	Manuel Antonio Tocornal 661	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:40:53.177	2025-11-06 18:40:53.177	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnrywnb001ynu01hf86lzko	Sargento Aldea 582 (San Isidro)	Sargento Aldea 582	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:43:30.119	2025-11-06 18:43:30.119	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnq8dih000anu01c9fvv5wa	Santa Isabel 55	Av. Santa Isabel 55	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 17:54:52.649	2025-11-06 18:46:23.872	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnrhi7e001knu01yx7k85ko	Plaza Perú	Av. Perú 1479	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:29:58.249	2025-11-06 18:48:11.037	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Recoleta	Región Metropolitana
cmhnqne3y000knu01qlqm28jr	Ejército Libertador 634	Av. Ejército Libertador 634	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:06:33.261	2025-11-06 18:49:44.397	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhnqkqfl000gnu01d267ux4k	Buzeta 4027	Av. Buzeta 4027	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:04:29.265	2025-11-06 18:50:10.704	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Cerrillos	Región Metropolitana
cmhnqufxl000onu013u41skj2	José Domingo Cañas 445	José Domingo Cañas 445 	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:12:02.217	2025-11-06 18:50:57.076	\N	cmhnpn12m0003nu01rr1qryuh	\N	\N	Santiago	\N	Ñuñoa	Región Metropolitana
cmhntsbij0022nu014b2t07ew	Amengual	Gral Amengual 102	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 19:34:22.027	2025-11-06 19:34:22.027	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Estación Central	Región Metropolitana
cmhntwona0026nu01aw5fxvqj	Plaza Conde del Maule	Conde del Maule 4631	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 19:37:45.67	2025-11-06 19:37:45.67	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Estación Central	Región Metropolitana
cmhntz8k90028nu01ugx79exo	Concon	Cnel. Souper 4400	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 19:39:44.793	2025-11-06 19:39:44.793	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Estación Central	Región Metropolitana
cmhnu0igv002anu014w2hncec	Alto Conde	Conde del Maule 4160	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 19:40:44.287	2025-11-06 19:40:44.287	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Estación Central	Región Metropolitana
cmhnu1v2g002cnu01dgap9yxl	Plaza Central	Av. Ecuador 4626	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 19:41:47.272	2025-11-06 19:41:47.272	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Estación Central	Región Metropolitana
cmhnu9gbc002enu01ykosgt8t	Home Inclusive Ecuador	Gral. Amengual 0148	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 19:47:41.4	2025-11-06 19:47:41.4	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Estación Central	Región Metropolitana
cmhnucj51002gnu01usds4b2q	Edificio Cinco de Abril	Hermanos Arellano 160	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 19:50:05.029	2025-11-06 19:50:05.029	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Estación Central	Región Metropolitana
cmhnuhwzd002inu01g4hux8fl	Los Almendros Torre A	La Rinconada 291	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 19:54:16.249	2025-11-06 19:54:16.249	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Huechuraba	Región Metropolitana
cmhnukky1002knu011e68t1v5	Alma Hipódromo	Hipódromo Chile 1631	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-06 19:56:20.617	2025-11-06 19:56:20.617	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Independencia	Región Metropolitana
cmho6dkgs0043nu01znb2hwj2	Edificio Coronel Souper 4171	Edificio Coronel Souper 4171	\N	cmhnq6h2x0008nu016g7mjfs3	2025-11-07 01:26:48.796	2025-11-07 01:26:48.796	\N	cmho6chff0041nu01qdtfj9f9	\N	\N	Santiago	\N	Estación Central	Región Metropolitana
cmho6hrs40046nu01bfsc5q74	Pudeto 6908	C. Pudeto 6908	\N	cmhnq6h2x0008nu016g7mjfs3	2025-11-07 01:30:04.9	2025-11-07 01:30:04.9	\N	cmho6gmhn0044nu01ioismw3w	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmho6kfpd0048nu01dejnnqby	Castillo Urizar 1845	Castillo Urizar 1845	\N	cmhnq6h2x0008nu016g7mjfs3	2025-11-07 01:32:09.217	2025-11-07 01:32:09.217	\N	cmho6gmhn0044nu01ioismw3w	\N	\N	Santiago	\N	Ñuñoa	Región Metropolitana
cmho7x9nd004tnu01b6qtp6cp	Home Inclusive Independencia	Escanilla 1035	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-07 02:10:07.512	2025-11-07 02:10:07.512	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Independencia	Región Metropolitana
cmhp25oks005inu01w7kcs6y3	Vicuña Urban	Av. Vicuña Mackenna Pte. 6650	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-07 16:16:28.588	2025-11-07 16:16:28.588	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhp3dysm005onu01sqql8685	Serrano Capital	Serrano 562	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-07 16:50:54.694	2025-11-07 16:50:54.694	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhp6m9jm0068nu011rko89eo	Activa Cerro Blanco	Dr. Raimundo Charlin 655	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-07 18:21:20.722	2025-11-07 18:21:20.722	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Recoleta	Región Metropolitana
cmhpij0j1006inu01o3401uio	Mirador Gamero	Gamero 1363	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-07 23:54:44.461	2025-11-07 23:54:44.461	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Independencia	Región Metropolitana
cmhpikj89006knu01hngedgot	Activa Bezanilla	Bezanilla 1320	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-07 23:55:55.353	2025-11-07 23:55:55.353	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Independencia	Región Metropolitana
cmhpimhod006mnu011d07yoz8	Conecta Despouy	Gastón Despouy 8740	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-07 23:57:26.653	2025-11-07 23:57:26.653	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Cisterna	Región Metropolitana
cmhpiobbi006onu01ezdmy8qp	Mirador José Ureta	José Ureta 139 	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-07 23:58:51.726	2025-11-07 23:58:51.726	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Cisterna	Región Metropolitana
cmhpiprky006qnu01m58s84ke	Garden La Cisterna	José Ureta 501	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-07 23:59:59.458	2025-11-07 23:59:59.458	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Cisterna	Región Metropolitana
cmhpirggo006snu01iy0wvxtj	Mirador Azul	Vicuña Mackenna Poniente 6239	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:01:18.36	2025-11-08 00:01:18.36	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpit3rc006unu01swtwvmeo	Edificio San Carlos	San Carlos de Ancud 74	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:02:35.206	2025-11-08 00:02:35.206	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpizffz006wnu01t5gwyeul	Antonia	Fresia 6955	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:07:30.287	2025-11-08 00:07:30.287	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpj1zdc006ynu01ptkvz4za	Torres de Vicuña Mackenna	Av. Vicuña Mackenna Pte. 6456	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:09:29.424	2025-11-08 00:09:29.424	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpj3fqg0070nu01601gi9dz	Barrio Juan de Pineda	Juan de Pineda 7704	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:10:37.289	2025-11-08 00:10:37.289	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpj4xad0072nu01z1s4o8op	Mirador Capital	Av. Vicuña Mackenna Ote. 6197	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:11:46.693	2025-11-08 00:11:46.693	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpj64av0074nu01cutke4kd	Lofty	Av. Vicuña Mackenna Ote. 6711	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:12:42.439	2025-11-08 00:12:42.439	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpj6zj00076nu01qi2wjdb1	Casa Roble	Paso El Roble 139	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:13:22.908	2025-11-08 00:13:22.908	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpj83600078nu01h3fibele	Activa Vicuña Mackenna Poniente	Av. Vicuña Mackenna Pte. 6315	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:14:14.28	2025-11-08 00:14:14.28	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpj9pya007anu01k6a8dznr	Lia Aguirre	Lia Aguirre 95	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:15:30.466	2025-11-08 00:15:30.466	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpjcjmy007cnu01eyofxb0s	Florida Capital	Froilán Roa 5746	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:17:42.25	2025-11-08 00:17:42.25	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpjfauc007enu0115sfl1fr	Vespucio Capital	Av. Vicuña Mackenna 7630	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:19:50.82	2025-11-08 00:19:50.82	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	La Florida	Región Metropolitana
cmhpjhh36007gnu01reorhjk6	Las Verbenas	Las Verbenas 9001	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:21:32.226	2025-11-08 00:21:32.226	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Las Condes	Región Metropolitana
cmhpjjooo007inu01qlhwzcah	Activa Juan Mitjans	Juan Mitjans 135	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:23:15.385	2025-11-08 00:23:15.385	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Macul	Región Metropolitana
cmhpjkub1007knu012j982kzs	Pio X	San Pío X 2555	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:24:09.325	2025-11-08 00:24:09.325	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Providencia	Región Metropolitana
cmhpjlxwd007mnu01z4smkd9y	Huelén	Huelén 164	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:25:00.637	2025-11-08 00:25:00.637	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Providencia	Región Metropolitana
cmhpjmxaf007onu01ovx11f72	Factoria Italia	Av. Francisco Bilbao 489	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:25:46.503	2025-11-08 00:25:46.503	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Providencia	Región Metropolitana
cmhpjnqda007qnu019zh9njwk	Urbana 35	Av. Vicuña Mackenna 35	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:26:24.19	2025-11-08 00:26:36.973	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Providencia	Región Metropolitana
cmhpjoppp007snu010y51xd7s	Alférez Real	Alférez Real 1050	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:27:09.997	2025-11-08 00:27:09.997	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Providencia	Región Metropolitana
cmhpjqdlk007unu01a0w9r16d	Maestra Gabriela	Los Cipreses 3422	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:28:27.608	2025-11-08 00:28:27.608	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Puente Alto	Región Metropolitana
cmhpjrcwl007wnu017uokux3e	Santo Domingo - MF	Santo Domingo 4272	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:29:13.365	2025-11-08 00:29:31.94	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Quinta Normal	Región Metropolitana
cmhpjstky007ynu01cf3byy05	Borgetto	Radal 1227	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:30:21.631	2025-11-08 00:30:21.631	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Quinta Normal	Región Metropolitana
cmhpjunjj0080nu01xnl7xqda	Edificio Altavista	Rivas 581	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:31:47.119	2025-11-08 00:31:47.119	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	San Joaquin	Región Metropolitana
cmhpjwvi20082nu019o0761fr	Álvarez Toledo	Álvarez de Toledo 978	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:33:30.746	2025-11-08 00:33:30.746	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	San Miguel	Región Metropolitana
cmhpjxu4o0084nu012id2vjh9	Edificio Paseo Vial	Gran Av. José Miguel Carrera 4311	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:34:15.625	2025-11-08 00:34:15.625	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	San Miguel	Región Metropolitana
cmhpjz25u0086nu01ocatwjgo	Edificio MILAN III	Milán 1440	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:35:12.69	2025-11-08 00:35:12.69	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	San Miguel	Región Metropolitana
cmhpjzsfx0088nu01sp3agz7p	Lazo I	Lazo 1350	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:35:46.749	2025-11-08 00:36:33.918	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	San Miguel	Región Metropolitana
cmhpk1apy008anu01vesbid8i	Lazo II	Lazo 1350	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:36:57.094	2025-11-08 00:36:57.094	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	San Miguel	Región Metropolitana
cmhpk2ed8008cnu01da697s2b	Barrio Teresa Vial	Teresa Vial 1175	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:37:48.476	2025-11-08 00:37:48.476	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	San Miguel	Región Metropolitana
cmhpk3aou008enu018akju7r1	Carnot	Carnot 1069	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:38:30.366	2025-11-08 00:38:30.366	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	San Miguel	Región Metropolitana
cmhpk47g3008gnu01bgyht3cl	Toledo Rent	Álvarez de Toledo 672	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:39:12.819	2025-11-08 00:39:12.819	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	San Miguel	Región Metropolitana
cmhpk5dbr008inu011j6b3rtw	Matucana	Matucana 31	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:40:07.095	2025-11-08 00:40:07.095	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhpk68d1008knu0131qifbz4	Portugal	Av. Portugal 676	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:40:47.317	2025-11-08 00:40:47.317	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhpk70y1008mnu01pm0wt8b3	Echaurren	Pje. Echaurren 40	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:41:24.361	2025-11-08 00:41:24.361	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhpk80lu008onu010kwt0hkd	Midtown Santiago	Arturo Prat 621	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:42:10.578	2025-11-08 00:42:10.578	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhpk8xtr008qnu019x41gwl0	Morande Sur	Morandé 776	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 00:42:53.631	2025-11-08 00:43:11.101	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhql5tc1009lnu01x1y4j56k	FAM Huemul	Centenario 1329	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 17:56:13.633	2025-11-08 17:56:13.633	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhql79uv009nnu01yorze3pi	Romero	Romero 2349	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 17:57:21.704	2025-11-08 17:57:21.704	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlaee4009pnu01j1d19a2x	Claudio Gay	Claudio Gay 2547	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 17:59:47.548	2025-11-08 17:59:47.548	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlbtqt009rnu011qv2w4h6	Vive Santa Isabel	Av. Sta. Rosa 537	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:00:54.101	2025-11-08 18:00:54.101	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqldboi009tnu01tz8tt54e	Vista San Martin	San Martín 811	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:02:04.002	2025-11-08 18:02:04.002	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqles44009vnu01na2oclxw	Vicuña Capital	Av. Vicuña Mackenna 1441	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:03:11.956	2025-11-08 18:03:11.956	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlfyp4009xnu01mr83unp2	Carrera Capital	José Miguel Carrera 68	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:04:07.144	2025-11-08 18:04:07.144	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlh9ft009znu016b3k98k4	Espacio Oriente II Torre A	Sta. Elena 1278	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:05:07.721	2025-11-08 18:05:07.721	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlikl900a1nu01nq35hreu	Nuevo Oriente I	Sta. Elena 1486	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:06:08.829	2025-11-08 18:06:08.829	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqljz1q00a3nu01ll1kwlh7	Nuevo Oriente II	Sta. Elena 1496	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:07:14.222	2025-11-08 18:07:14.222	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqllie900a5nu01ixagn9tc	Edificio Santa Rosa	Av. Sta. Rosa 1185	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:08:25.953	2025-11-08 18:08:25.953	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlmkel00a7nu01fevc72lv	Home Inclusive Ejército	Av. Ejército Libertador 71	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:09:15.213	2025-11-08 18:09:15.213	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlohjc00a9nu01edgo55zp	Home Inclusive Carmen	Carmen 668	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:10:44.808	2025-11-08 18:10:44.808	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlp9a300abnu01vjhr2fdc	Edificio San Isidro 543	San Isidro 543	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:11:20.763	2025-11-08 18:11:33.594	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlqf1d00adnu01wpybhb3n	Nueva Valdes	Nueva de Valdés 657	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:12:14.881	2025-11-08 18:12:14.881	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlrnzk00afnu017e9yf9zo	Stage San Diego	San Diego 135	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:13:13.136	2025-11-08 18:13:13.136	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlsxa700ahnu012p31d8zk	Home Inclusive Manuel Rodriguez	Guardia Marina Ernesto Riquelme 479	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:14:11.839	2025-11-08 18:14:11.839	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlu7nq00ajnu01vtkc8d8m	MAT	Manuel Antonio Tocornal 343	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:15:11.941	2025-11-08 18:15:11.941	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlv41t00alnu018enh0udl	Sazié	Sazié 2357	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:15:53.921	2025-11-08 18:15:53.921	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Santiago	Región Metropolitana
cmhqlw4ly00annu01ym9bijny	Pedro de Valdivia	Av. Pedro de Valdivia 4170	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:16:41.303	2025-11-08 18:16:57.531	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Ñuñoa	Región Metropolitana
cmhqlycri00apnu01bk6h8ytc	Exequiel Fernández 2000	Exequiel Fernández 2000	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:18:25.182	2025-11-08 18:18:25.182	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Ñuñoa	Región Metropolitana
cmhqlz4jv00arnu016n7uf2hr	Zañartu Capital	Zañartu 1145	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:19:01.192	2025-11-08 18:19:01.192	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Ñuñoa	Región Metropolitana
cmhqm00ye00atnu01jp66tctg	Vista Parque	Av. Pedro de Valdivia 5223	\N	cmhnq5mm10006nu01dhusnl3i	2025-11-08 18:19:43.189	2025-11-08 18:19:43.189	\N	cmhnpkogt0002nu01vd89ufkf	\N	\N	Santiago	\N	Ñuñoa	Región Metropolitana
cmi57ey2j00jrnu01jnt4xikf	Punta Arenas 6900	Punta Arenas 6900	\N	cmhnq6h2x0008nu016g7mjfs3	2025-11-18 23:27:57.691	2025-11-18 23:27:57.691	\N	cmi576ksj00jlnu0143adsalc	\N	\N	La Florida	\N	La Florida	Región Metropolitana de Santiago
\.


--
-- Data for Name: empresas; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.empresas (id, nombre, rut, "razonSocial", direccion, telefono, email, activa, "createdAt", "updatedAt") FROM stdin;
cmhnpn12m0003nu01rr1qryuh	BLUEHOME	76.691.098-K	INMOBILIARIA SANTIAGO SPA	ROSARIO NORTE 615 OF. DEPTO 1801, LAS CONDES	+56 9 8136 8603	gmeneses@bluehome.cl	t	2025-11-06 17:38:16.751	2025-11-06 17:38:16.751
cmhnpu2810004nu013y6a8fr8	I-RENTUP	77.741.192-6	I-LIVING RENT SPA	AV ALONSO DE CORDOVA 4125OF 3043P, VITACURA	+56 9 5921 1393	pvildosola@i-rentup.cl	t	2025-11-06 17:43:44.833	2025-11-06 17:43:44.833
cmhnpz0mz0005nu0103elril7	KODU	77.389.188-5	RENTOKEA SPA	Hendaya 60, piso 7, Las Condes.	\N	lmachicao@rentokea.cl	t	2025-11-06 17:47:36.059	2025-11-06 17:47:36.059
cmho6chff0041nu01qdtfj9f9	Jose Manuel Jimenez Aponte	25.240.414-7	Jose Manuel Jimenez Aponte	Coronel Souper 4171, Estación Central	+56 9 2077 0588	jmjimenez.aponte@gmail.com	t	2025-11-07 01:25:58.203	2025-11-07 01:25:58.203
cmho6gmhn0044nu01ioismw3w	MAIREVIS SIDNEY COBA VILLALOBOS	25.173.595-6	MAIREVIS SIDNEY COBA VILLALOBOS	Evaristo Lillo 29, Las Condes	+56 9 5483 5686	SIDNEY.COBA19@GMAIL.COM	t	2025-11-07 01:29:11.388	2025-11-07 01:29:11.388
cmhnpkogt0002nu01vd89ufkf	ASSETPLAN	76.147.318-2	ASSETPLAN ASESORES SPA	E FOSTER SUR 20 OF 401, LAS CONDES	+56 9 9078 6381	carlos.echeverria@assetplan.cl	t	2025-11-06 17:36:27.101	2025-11-08 17:08:46.259
cmi576ksj00jlnu0143adsalc	Maria Belen Taladriz Suarez	15.657.526-7	Maria Belen Taladriz Suarez	Pudeto 6900	+56 9 9342 3064	belentaladriz@gmail.com	t	2025-11-18 23:21:27.236	2025-11-18 23:21:27.236
\.


--
-- Data for Name: imagenes_edificio; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.imagenes_edificio (id, "edificioId", url, descripcion, orden, "createdAt", "updatedAt", "imageType") FROM stdin;
cmhy9uchw00i1nu01snnrcnf0	cmhqm00ye00atnu01jp66tctg	/uploads/edificios/1763089292221-tc7byjyzfn.png	\N	1	2025-11-14 03:01:32.228	2025-11-14 03:01:32.228	UPLOAD
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.leads (id, "codigoUnidad", "totalLead", "montoUf", comision, estado, "fechaPagoReserva", "fechaPagoLead", "fechaCheckin", postulacion, observaciones, conciliado, "fechaConciliacion", "reglaComisionId", "createdAt", "updatedAt", "brokerId", "clienteId", "unidadId", "edificioId", "comisionId", "tipoUnidadEdificioId") FROM stdin;
cmhp435ta0062nu01wte10uwr	\N	335000	8.45	83750	APROBADO	2025-10-22 00:00:00	2025-10-24 00:00:00	2025-11-03 00:00:00	\N	\N	f	\N	\N	2025-11-07 17:10:30.19	2025-11-08 17:06:02.806	cmhp20l9y005gnu01lxalm8ri	cmhp435kf0060nu010z4txe0x	cmhp28qty005mnu01i5rxo53w	cmhp25oks005inu01w7kcs6y3	cmhnq5mm10006nu01dhusnl3i	cmhp278mv005knu016fkwtuty
cmhwbazcg00bznu01y1v4pwz9	CDMD911-A	0	7.54	0	ENTREGADO	2025-11-12 00:00:00	\N	2025-12-01 00:00:00	\N	Conde del maule 4631, CDMD911-A	f	\N	\N	2025-11-12 18:06:55.6	2025-12-01 15:04:04.989	cmhnp489x0000nu01bdxkfmd1	cmhwbaz1j00bxnu01hzf8p5ov	\N	cmhp3dysm005onu01sqql8685	cmhxtd8ry00d4nu013j1kpp9f	cmhp3epmm005qnu01dnesvxqh
cmhp4d81v0066nu010bzjeh5a	\N	420000	10.6	126000	APROBADO	2025-11-05 00:00:00	\N	\N	\N	Arriendo con estacionamiento de Auto / Dpto: 355 mil / Estacionamiento: 65 mil	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-07 17:18:19.651	2025-11-15 20:58:30.954	cmhp20l9y005gnu01lxalm8ri	cmhp4d7te0064nu01k9m0po7b	cmhp3fjht005snu01bpbn2u1u	cmhp3dysm005onu01sqql8685	cmhnq5mm10006nu01dhusnl3i	cmhp3epmm005qnu01dnesvxqh
cmhqgqtss0098nu01a2uj7fyc	PUD1419	350000	8.83	140000	APROBADO	2025-10-18 00:00:00	2025-10-22 00:00:00	2025-11-01 00:00:00	PUD1419	PUD1419	f	\N	\N	2025-11-08 15:52:35.932	2025-11-08 17:19:48.981	cmhqfwbvr0092nu01dhx88gr5	cmhqgqtj40096nu011hct2zkj	cmho79gcc004mnu010i8b1k1e	cmho6hrs40046nu01bfsc5q74	cmhnq6h2x0008nu016g7mjfs3	cmho78pdj004knu01tzdlq5ld
cmhp3s265005ynu010ecfb0l1	SRRD517	400000	10.09	120000	APROBADO	2025-11-01 00:00:00	2025-11-04 00:00:00	2025-11-04 00:00:00	SRRD517	Arriendo con estacionamiento de Moto.\n375 mil mas 25 mil\n400 Mil	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-07 17:01:52.253	2025-11-15 20:58:30.96	cmhp20l9y005gnu01lxalm8ri	cmhp3s1y3005wnu010pv6qrhg	cmhp3iriw005unu01es88lq68	cmhp3dysm005onu01sqql8685	cmhnq5mm10006nu01dhusnl3i	cmhp3epmm005qnu01dnesvxqh
cmhuwvlsa00bvnu01klj2mfnh	Unidad SRRD211	0	8.95	0	RECHAZADO	\N	\N	\N	\N	\N	f	\N	\N	2025-11-11 18:35:17.386	2025-11-14 04:09:02.289	cmhp20l9y005gnu01lxalm8ri	cmhuwvlko00btnu015ailm5fw	\N	cmhp3dysm005onu01sqql8685	cmhnq5mm10006nu01dhusnl3i	cmhp3epmm005qnu01dnesvxqh
cmhxscluo00c7nu01dpo5k3tc	ABRD1512	316000	8	94800	APROBADO	2025-09-30 00:00:00	2025-10-02 00:00:00	2025-10-08 00:00:00	\N	\N	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-13 18:51:51.072	2025-11-13 19:36:17.943	cmhnpclzs0001nu01fuix77i5	cmhxsclme00c5nu01pdo5zdzk	cmhxs55lp00c3nu01hju1ny6y	cmhnucj51002gnu01usds4b2q	cmhxtd8ry00d4nu013j1kpp9f	cmhxs40gh00c1nu01zmx6icv1
cmhui8axx00bpnu01nq8vo8a8	\N	0	0	0	RECHAZADO	2025-11-12 00:00:00	\N	\N	\N	\N	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-11 11:45:15.62	2025-11-15 20:58:30.965	cmhp20l9y005gnu01lxalm8ri	cmhui8aq000bnnu015ahit8pb	cmhuhzkrs00blnu01zbltpfbg	cmhnqwgx4000snu014paiyvsy	cmhnq5mm10006nu01dhusnl3i	cmhuhy7c300bjnu01v6er6u14
cmhp7ghco006gnu01kzwcdaha	CBLD1302	0	0	0	RECHAZADO	2025-09-11 00:00:00	2025-09-11 00:00:00	2025-09-12 00:00:00	\N	\N	f	\N	\N	2025-11-07 18:44:50.52	2025-11-14 23:26:12.011	cmhp20l9y005gnu01lxalm8ri	cmhp7gh4k006enu01z3nes0o1	cmhp6o4ph006cnu01647590fb	cmhp6m9jm0068nu011rko89eo	cmhnq5mm10006nu01dhusnl3i	cmhp6ndc1006anu01q8xl0o8v
cmhqjqdkx009jnu01c71sk8ja	\N	0	8.38	0	ENTREGADO	2025-11-05 00:00:00	2025-11-07 00:00:00	2025-11-15 00:00:00	\N	Entrega 15/11, 2:00 pm	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-08 17:16:13.762	2025-11-15 20:58:30.969	cmhnp489x0000nu01bdxkfmd1	cmhoxy0al005dnu01ba2g830s	cmhqjlc56009hnu01bjipiwg5	cmhpk80lu008onu010kwt0hkd	cmhnq5mm10006nu01dhusnl3i	cmhqjktdy009fnu01s8pqa1fz
cmhxt7mpq00d3nu013ndxoy2n	VECD810	420000	10.61	126000	APROBADO	2025-10-28 00:00:00	2025-10-29 00:00:00	2025-10-31 00:00:00	\N	\N	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-13 19:15:58.526	2025-11-13 19:28:39.365	cmhnpclzs0001nu01fuix77i5	cmhxt7mgy00d1nu01yzgs84m6	cmhxt3txo00cznu01k9rac6sk	cmhpjfauc007enu0115sfl1fr	cmhxtd8ry00d4nu013j1kpp9f	cmhxt3h4m00cxnu01yl9gyf0x
cmhoxy0ht005fnu017cwhyabd	PRLD604-B	0	0	0	RECHAZADO	2025-11-05 00:00:00	2025-11-07 00:00:00	\N	\N	Arturo prat 621	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-07 14:18:32.321	2025-11-15 20:58:30.973	cmhnp489x0000nu01bdxkfmd1	cmhoxy0al005dnu01ba2g830s	\N	cmho7x9nd004tnu01b6qtp6cp	cmhnq5mm10006nu01dhusnl3i	cmho8337h004znu01p47yl3fd
cmhxst4h500cnnu01p45m1d18	RODD210	325000	8.22	97500	APROBADO	2025-10-14 00:00:00	2025-10-14 00:00:00	2025-10-15 00:00:00	\N	\N	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-13 19:04:41.705	2025-11-13 19:29:32.93	cmhnpclzs0001nu01fuix77i5	cmhxst49900clnu01m4qdhs6p	cmhxspo5j00cjnu01vzk1klbp	cmhqlsxa700ahnu012p31d8zk	cmhxtd8ry00d4nu013j1kpp9f	cmhxsp6j800chnu017qrb78qk
cmhxus56e00dcnu01jh7pl7mm	\N	288000	7.3	72000	ENTREGADO	2025-09-30 00:00:00	2025-10-01 00:00:00	2025-10-10 00:00:00	\N	\N	f	\N	\N	2025-11-13 19:59:55.19	2025-11-18 16:35:21.78	cmhnp489x0000nu01bdxkfmd1	cmhxus4yg00danu01v07l8hmc	cmhxup0mx00d8nu01y7wi0ugb	cmhqlqf1d00adnu01wpybhb3n	cmhnq5mm10006nu01dhusnl3i	cmhxuol0p00d6nu01lac2wpmo
cmhxt1bfr00cvnu011807wfoi	CCND1309	345000	8.71	103500	APROBADO	2025-10-02 00:00:00	2025-10-10 00:00:00	2025-10-31 00:00:00	\N	\N	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-13 19:11:03.975	2025-11-13 19:29:08.513	cmhnpclzs0001nu01fuix77i5	cmhxt1b7900ctnu01uyzdbgkg	cmhxsvh4n00crnu018ajbtiw3	cmhntz8k90028nu01ugx79exo	cmhxtd8ry00d4nu013j1kpp9f	cmhxsv22300cpnu01wk1onvo8
cmho8su6n005bnu01ya83x2eu	IDPD1315A	0	0	0	RECHAZADO	2025-11-07 00:00:00	\N	\N	\N	IDPD1315A	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-07 02:34:40.463	2025-11-18 16:35:59.429	cmhnp489x0000nu01bdxkfmd1	cmho8styh0059nu01rssg4kt2	\N	cmho7x9nd004tnu01b6qtp6cp	cmhnq5mm10006nu01dhusnl3i	cmho89ydo0053nu0125x8dy51
cmhxsnctn00cfnu01yhqk9prc	VNCD1419	385000	9.75	115500	APROBADO	2025-10-03 00:00:00	2025-10-03 00:00:00	2025-10-03 00:00:00	\N	\N	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-13 19:00:12.586	2025-11-13 19:30:02.132	cmhnpclzs0001nu01fuix77i5	cmhxsncl700cdnu0139sjyvax	cmhxshbqr00cbnu01vht2rxin	cmhqles44009vnu01na2oclxw	cmhxtd8ry00d4nu013j1kpp9f	cmhxsgv8t00c9nu01lg9ofdig
cmhtfwymo00b1nu01dckuevdy	304	0	11.876	0	APROBADO	2025-11-14 00:00:00	2025-11-11 00:00:00	\N	\N	\N	f	\N	cmhnqzoqa0010nu01s8ww7wnz	2025-11-10 17:52:41.04	2025-11-15 20:58:30.944	cmhqfwbvr0092nu01dhx88gr5	cmhtfwydk00aznu014tbf3cxa	cmhtej7d700axnu011ctiru94	cmhnr8ixt001gnu01hxg12zab	cmhnq5mm10006nu01dhusnl3i	cmhtegbgc00avnu018ch26txd
cmhuhbdhc00bhnu01t86n8xjn	\N	0	7.893	0	ENTREGADO	2025-10-17 00:00:00	2025-10-31 00:00:00	2025-11-03 00:00:00	\N	\N	f	\N	\N	2025-11-11 11:19:39.264	2025-11-15 13:33:05.747	cmhnp489x0000nu01bdxkfmd1	cmhuhbd9p00bfnu01a9wtkv0z	cmhtzdbxd00b5nu01f1ocoybg	cmhnqkqfl000gnu01d267ux4k	cmhnq5mm10006nu01dhusnl3i	cmhtzbo3v00b3nu01m3bi6b7d
cmhxvlkwl00dmnu01ymiabmhn	VECD812	360000	9.67	108000	APROBADO	2025-08-31 00:00:00	2025-09-01 00:00:00	2025-10-03 00:00:00	\N	\N	f	\N	\N	2025-11-13 20:22:48.597	2025-11-13 20:36:56.157	cmhnvdsvv002lnu01prp9jh1k	cmhxvlkof00dknu01dvg546gg	cmhxvazvw00denu01qndtzxe7	cmhpjfauc007enu0115sfl1fr	cmhxtd8ry00d4nu013j1kpp9f	cmhxt3h4m00cxnu01yl9gyf0x
cmhxvyzhm00dunu010bmwisl8	\N	360000	9.1	90000	APROBADO	2025-10-27 00:00:00	2025-10-27 00:00:00	2025-10-29 00:00:00	\N	\N	f	\N	\N	2025-11-13 20:33:14.026	2025-11-13 20:37:23.848	cmhnvdsvv002lnu01prp9jh1k	cmhxvyz9n00dsnu011cqsibnq	cmhxvdsyh00dinu01dnl3aa6v	cmhpjfauc007enu0115sfl1fr	cmhnq5mm10006nu01dhusnl3i	cmhxt3h4m00cxnu01yl9gyf0x
cmhxvsfwc00dqnu01qqv1djo3	\N	385000	9.88	96250	APROBADO	2025-09-29 00:00:00	2025-10-13 00:00:00	2025-10-16 00:00:00	\N	\N	f	\N	\N	2025-11-13 20:28:08.7	2025-11-13 20:38:56.079	cmhnvdsvv002lnu01prp9jh1k	cmhxvsfo300donu01pb8b7ruy	cmhxvckkz00dgnu01vqkgkyfs	cmhpjfauc007enu0115sfl1fr	cmhnq5mm10006nu01dhusnl3i	cmhxt3h4m00cxnu01yl9gyf0x
cmhu0v26100bdnu01tlnojy9h	RODD307	0	13.42	0	ENTREGADO	2025-10-23 00:00:00	2025-10-24 00:00:00	2025-11-03 00:00:00	\N	\N	f	\N	\N	2025-11-11 03:39:04.249	2025-11-15 13:33:14.695	cmhnp489x0000nu01bdxkfmd1	cmhu0v1w400bbnu01v7pxj58d	cmhu0knqd00b9nu010p4bivji	cmhqlsxa700ahnu012p31d8zk	cmhnq5mm10006nu01dhusnl3i	cmhu08gho00b7nu01pcj2f190
cmhy0w2h300eonu01h3hj8mhi	\N	365000	9.23	91250	APROBADO	2025-10-22 00:00:00	2025-10-24 00:00:00	2025-10-24 00:00:00	\N	DPYD1204	f	\N	\N	2025-11-13 22:50:56.007	2025-11-13 22:51:33.86	cmhqfovpd0091nu01mww6odbc	cmhy0w29i00emnu01gd5iu2r2	cmhxwvd8y00ecnu01hj272slm	cmhpimhod006mnu011d07yoz8	cmhnq5mm10006nu01dhusnl3i	cmhxwuxzw00eanu017pc8s5hm
cmhy0s5ym00eknu01k5zyftbt	\N	490000	12.4	122500	APROBADO	2025-10-12 00:00:00	2025-10-15 00:00:00	2025-10-16 00:00:00	\N	\N	f	\N	\N	2025-11-13 22:47:53.902	2025-11-13 22:51:40.769	cmhqfovpd0091nu01mww6odbc	cmhy0s5qu00einu018q5hteej	cmhxwy52b00egnu01itd6es5b	cmhqlz4jv00arnu016n7uf2hr	cmhnq5mm10006nu01dhusnl3i	cmhxwxs8700eenu01go077e4z
cmhy41rxc00gcnu01lepbev7a	CBLD1407	439000	11.09	131700	APROBADO	2025-10-10 00:00:00	2025-10-11 00:00:00	2025-10-29 00:00:00	\N	\N	f	\N	\N	2025-11-14 00:19:21.12	2025-11-14 00:46:53.423	cmhqfmabj0090nu01fb3tkeip	cmhy41rox00ganu0147zcwmcx	\N	cmhp6m9jm0068nu011rko89eo	cmhxtd8ry00d4nu013j1kpp9f	\N
cmhy1nm2e00f6nu01vfbxca6y	\N	360000	9.64	108000	APROBADO	2025-10-29 00:00:00	2025-10-30 00:00:00	2025-10-30 00:00:00	\N	\N	f	\N	\N	2025-11-13 23:12:21.11	2025-11-13 23:34:21.347	cmhqfksb1008znu01wxt3ekhx	cmhy1nlv800f4nu0192ymmvye	cmhy19dpr00eynu01mbzw3fds	cmhp3dysm005onu01sqql8685	cmhxtd8ry00d4nu013j1kpp9f	cmhp3epmm005qnu01dnesvxqh
cmhy1jejt00f2nu01kc3f8tox	\N	353000	8.94	105900	APROBADO	2025-10-13 00:00:00	2025-10-19 00:00:00	2025-10-20 00:00:00	\N	RODD201	f	\N	\N	2025-11-13 23:09:04.745	2025-11-13 23:35:02.057	cmhqfksb1008znu01wxt3ekhx	cmhy1jecd00f0nu01k8mdxx1v	cmhy1198300esnu01xxbho7lc	cmhqlsxa700ahnu012p31d8zk	cmhxtd8ry00d4nu013j1kpp9f	cmhy10n9900eqnu01cr2g55zn
cmhy3wqw700g8nu01lor0db0b	DGOD1217	258000	6.54	77400	APROBADO	2025-10-05 00:00:00	2025-10-08 00:00:00	2025-10-09 00:00:00	\N	\N	f	\N	\N	2025-11-14 00:15:26.503	2025-11-14 00:47:17.463	cmhqfmabj0090nu01fb3tkeip	cmhy3wqov00g6nu01aw8b4t88	cmhy35c1w00fqnu01yhbxr9ot	cmhpjrcwl007wnu017uokux3e	cmhxtd8ry00d4nu013j1kpp9f	cmhy351rd00fonu01v2ayhso1
cmhy6tso000hanu01tpz4dcfo	\N	265000	6.72	66250	APROBADO	2025-10-01 00:00:00	2025-10-07 00:00:00	2025-10-10 00:00:00	\N	\N	f	\N	\N	2025-11-14 01:37:07.68	2025-11-14 02:07:43.006	cmhnwaeq9002pnu017u5x1dkt	cmhy6ts9300h8nu01x19qrecw	cmhy6ql2800h6nu01y4uphhvl	cmhntz8k90028nu01ugx79exo	cmhnq5mm10006nu01dhusnl3i	cmhy6odcz00h2nu01wph62inn
cmhy6y68300henu01xpu4x87x	\N	252000	6.39	63000	APROBADO	2025-09-15 00:00:00	2025-10-03 00:00:00	2025-10-10 00:00:00	\N	\N	f	\N	\N	2025-11-14 01:40:31.875	2025-11-14 02:07:50.374	cmhnwaeq9002pnu017u5x1dkt	cmhy6y60n00hcnu01nv72paq7	cmhy6oso000h4nu01yiivib12	cmhntz8k90028nu01ugx79exo	cmhnq5mm10006nu01dhusnl3i	cmhy6odcz00h2nu01wph62inn
cmhy7stq000hlnu01479er2di	\N	391000	9.9	97750	APROBADO	2025-10-14 00:00:00	2025-10-16 00:00:00	2025-10-16 00:00:00	\N	\N	f	\N	\N	2025-11-14 02:04:22.008	2025-11-14 02:07:57.595	cmhy7mq9v00hfnu016zkghrx0	cmhy7sthe00hjnu016fpvdife	cmhy7pwmu00hhnu01s1to60qg	cmho7x9nd004tnu01b6qtp6cp	cmhnq5mm10006nu01dhusnl3i	cmho89ydo0053nu0125x8dy51
cmhy3pbjy00g4nu01v233oxog	SNMD1212	350000	8.86	87500	APROBADO	2025-09-29 00:00:00	2025-09-30 00:00:00	2025-10-15 00:00:00	\N	\N	f	\N	\N	2025-11-14 00:09:40.03	2025-11-14 00:50:45.98	cmhqfmabj0090nu01fb3tkeip	cmhy3pbck00g2nu01he2rpn76	cmhy2zx3f00fgnu01yiu4qydv	cmhqldboi009tnu01tz8tt54e	cmhnq5mm10006nu01dhusnl3i	cmhy2zkjb00fenu01rrh5yi4f
cmhy4m0r300gonu01tod3c6n9	SNMD311	356000	9	106800	APROBADO	2025-10-16 00:00:00	2025-10-17 00:00:00	2025-10-29 00:00:00	\N	\N	f	\N	\N	2025-11-14 00:35:05.679	2025-11-14 00:45:54.098	cmhqfmabj0090nu01fb3tkeip	cmhy4m0it00gmnu013tusjjt8	cmhy333bc00fmnu015sir30nq	cmhqldboi009tnu01tz8tt54e	cmhxtd8ry00d4nu013j1kpp9f	cmhy31xb300finu01na5i6lnp
cmhy4gi4d00gknu01t1ckib3v	SNMD1107	360000	9.1	108000	APROBADO	2025-10-15 00:00:00	2025-10-15 00:00:00	2025-10-29 00:00:00	\N	\N	f	\N	\N	2025-11-14 00:30:48.253	2025-11-14 00:46:26.491	cmhqfmabj0090nu01fb3tkeip	cmhy4ghv900ginu0162si4k1n	cmhy32d1y00fknu01ep6thzli	cmhqldboi009tnu01tz8tt54e	cmhxtd8ry00d4nu013j1kpp9f	cmhy31xb300finu01na5i6lnp
cmhy46zlw00ggnu013stdryw9	CBLD1101	582000	14.7	174600	APROBADO	2025-10-14 00:00:00	2025-10-20 00:00:00	2025-10-29 00:00:00	\N	\N	f	\N	\N	2025-11-14 00:23:24.356	2025-11-14 00:46:41.323	cmhqfmabj0090nu01fb3tkeip	cmhy46zeh00genu01q9dw3bxt	cmhy39cb600fwnu019sx7ygl8	cmhp6m9jm0068nu011rko89eo	cmhxtd8ry00d4nu013j1kpp9f	cmhp6ndc1006anu01q8xl0o8v
cmhy3idue00g0nu012lqg7y1t	SRRD920	360000	9.12	90000	APROBADO	2025-10-10 00:00:00	2025-10-10 00:00:00	2025-11-01 00:00:00	\N	\N	f	\N	\N	2025-11-14 00:04:16.406	2025-11-14 00:50:52.567	cmhqfmabj0090nu01fb3tkeip	cmhy3idm900fynu01s2f8o0op	cmhy2vg9y00fcnu01q8bxc0g4	cmhp3dysm005onu01sqql8685	cmhnq5mm10006nu01dhusnl3i	cmhp3epmm005qnu01dnesvxqh
cmhycmc7a00i6nu01ym0kuu7g	\N	230000	5.8	92000	APROBADO	2025-10-28 00:00:00	2025-10-30 00:00:00	2025-10-30 00:00:00	\N	\N	f	\N	\N	2025-11-14 04:19:17.446	2025-11-14 04:33:03.4	cmhqfksb1008znu01wxt3ekhx	cmhycmc0800i4nu010v7g8b5t	cmhy16qib00ewnu01fta8q0yz	cmho6dkgs0043nu01znb2hwj2	cmhnq6h2x0008nu016g7mjfs3	cmhy160vt00eunu018fjprccx
cmhy6i64c00h0nu01ss636v68	FLOD1611	355000	9.53	88750	APROBADO	2025-10-03 00:00:00	2025-10-09 00:00:00	2025-10-10 00:00:00	\N	\N	f	\N	\N	2025-11-14 01:28:05.243	2025-11-14 01:29:41.873	cmhnwgqkq002qnu017iz7yc97	cmhy6i5wq00gynu01idxg3kzy	cmhy6dtyo00gwnu018i31hnfh	cmhpjcjmy007cnu01eyofxb0s	cmhnq5mm10006nu01dhusnl3i	cmhxw9cww00dwnu0102w3pndo
cmhy65mvg00gunu01hp8vwnmi	\N	466400	11.82	116600	APROBADO	2025-10-06 00:00:00	2025-10-07 00:00:00	2025-10-13 00:00:00	\N	\N	f	\N	\N	2025-11-14 01:18:20.427	2025-11-14 01:29:53.691	cmhqh4yyd009bnu01a3kogkmx	cmhy65m6d00gsnu01tlzu6okr	cmhy61m8800gqnu01esbtv5b9	cmhqles44009vnu01na2oclxw	cmhnq5mm10006nu01dhusnl3i	cmhxsgv8t00c9nu01lg9ofdig
cmi4snt3f00jgnu01pbn0n61i	PRLD701-B	377000	9501	94250	ENTREGADO	2025-11-18 00:00:00	2025-11-18 00:00:00	2025-11-25 00:00:00	\N	Arturo prat 621, PRLD701-B	f	\N	\N	2025-11-18 16:34:56.907	2025-11-24 23:29:19.283	cmhnp489x0000nu01bdxkfmd1	cmi4snsvf00jenu01upopfbzu	\N	cmhp3dysm005onu01sqql8685	\N	cmhp3epmm005qnu01dnesvxqh
cmi0vhffj00jcnu01z1gurdfp	Punta arenas 6900, depto 407 sur	350000	8830	87500	ENTREGADO	2025-11-18 00:00:00	2025-11-18 00:00:00	2025-11-19 00:00:00	\N	Punta arenas 6900, depto. 407 sur	f	\N	\N	2025-11-15 22:42:53.407	2025-11-24 23:30:39.768	cmhnp489x0000nu01bdxkfmd1	cmi0vhf6i00janu012s30eser	\N	cmhpjfauc007enu0115sfl1fr	\N	cmhxt3h4m00cxnu01yl9gyf0x
cmiga2c4r00k7nu01e28x8xnm	\N	380000	9590	95000	RESERVA_PAGADA	2025-11-27 00:00:00	\N	2025-12-05 00:00:00	\N	Adicionales: MTCEM2, MTCB33	f	\N	\N	2025-11-26 17:27:36.171	2025-11-27 13:55:26.11	cmhnp489x0000nu01bdxkfmd1	cmiga2bp500k5nu011slj1oso	cmig9o85t00k3nu01jsrf1uks	cmhpk5dbr008inu011j6b3rtw	\N	cmig9jnd200k1nu012zohfr53
cmi7dtrvm00jznu01b8j152v9	Abdon cifuentes 150, depto 523 sur (BH).	331738	8368	82934.5	RESERVA_PAGADA	2025-11-25 00:00:00	\N	2025-12-17 00:00:00	\N	Jose miguel carrera 68, CRRD327	f	\N	\N	2025-11-20 12:02:59.554	2025-12-01 15:04:18.773	cmhnp489x0000nu01bdxkfmd1	cmi7dtrl500jxnu01t6mx4tza	\N	cmhntsbij0022nu014b2t07ew	\N	cmhy2o3wm00f8nu019gi60edx
cmioja8n300kgnu014dh0nhdf	\N	380000	9590	95000	ENTREGADO	2025-11-27 00:00:00	2025-11-29 00:00:00	2025-12-01 00:00:00	\N	Nombre errado. Es jhoselin gutierrez	f	\N	\N	2025-12-02 12:07:50.847	2025-12-02 12:08:24.958	cmhnp489x0000nu01bdxkfmd1	cmiga2bp500k5nu011slj1oso	cmioj4fqq00kenu01x0h6yjqk	cmhpk5dbr008inu011j6b3rtw	\N	cmig9jnd200k1nu012zohfr53
\.


--
-- Data for Name: metas_mensuales; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.metas_mensuales (id, "brokerId", mes, anio, "montoMeta", "createdAt", "updatedAt") FROM stdin;
cmhnsdbs00020nu01bla1z92g	\N	11	2025	4000000	2025-11-06 18:54:42.912	2025-11-06 18:54:42.912
cmhnwhtvs002snu01tvw42lq1	\N	12	2025	4000000	2025-11-06 20:50:11.464	2025-11-06 20:50:11.464
cmhnwi8m6002unu010zfuq09z	\N	1	2026	4000000	2025-11-06 20:50:30.559	2025-11-06 20:50:30.559
cmhnwj5te002ynu01wu3uy7bd	\N	3	2026	4000000	2025-11-06 20:51:13.586	2025-11-06 20:51:13.586
cmhnwinro002wnu01fjnpqhh5	\N	2	2026	4000000	2025-11-06 20:50:50.196	2025-11-06 20:51:22.735
cmhnwjlxy0030nu012wneqezi	\N	4	2026	4000000	2025-11-06 20:51:34.486	2025-11-06 20:51:34.486
cmhnwjx6g0032nu017x5me1kc	\N	5	2026	4000000	2025-11-06 20:51:49.049	2025-11-06 20:51:49.049
cmhnwk8sn0034nu01hynlwv0d	\N	6	2026	4000000	2025-11-06 20:52:04.103	2025-11-06 20:52:04.103
cmhnwkg7w0036nu017arpghlx	\N	7	2026	4000000	2025-11-06 20:52:13.724	2025-11-06 20:52:13.724
cmhnwkqo40038nu01rq1x6zdw	\N	8	2026	4000000	2025-11-06 20:52:27.268	2025-11-06 20:52:27.268
cmhnwkx3v003anu011eg6gpgm	\N	9	2026	4000000	2025-11-06 20:52:35.611	2025-11-06 20:52:35.611
cmhnwl2tr003cnu01p5wrwpx6	\N	10	2026	4000000	2025-11-06 20:52:43.023	2025-11-06 20:52:43.023
cmhnwl961003enu012r5e1adj	\N	11	2026	4000000	2025-11-06 20:52:51.241	2025-11-06 20:52:51.241
cmhnwlfll003gnu01lxjzs8qm	\N	12	2026	4000000	2025-11-06 20:52:59.577	2025-11-06 20:52:59.577
cmhnwltqc003inu01y0g20mo8	\N	10	2025	4000000	2025-11-06 20:53:17.892	2025-11-06 20:53:17.892
cmhnwm4t8003knu01ec3gfpur	\N	9	2025	4000000	2025-11-06 20:53:32.252	2025-11-06 20:53:32.252
cmhnwm8qw003mnu01vlyige8q	\N	1	2025	4000000	2025-11-06 20:53:37.352	2025-11-06 20:53:37.352
cmhnwmddx003onu016deptw3r	\N	2	2025	4000000	2025-11-06 20:53:43.365	2025-11-06 20:53:43.365
cmhnwmhar003qnu01vuqbn1ld	\N	3	2025	4000000	2025-11-06 20:53:48.435	2025-11-06 20:53:48.435
cmhnwmlra003snu01uxw9dm71	\N	4	2025	4000000	2025-11-06 20:53:54.214	2025-11-06 20:53:54.214
cmhnwmqy9003unu01r3d9ybvc	\N	5	2025	4000000	2025-11-06 20:54:00.945	2025-11-06 20:54:00.945
cmhnwmw2c003wnu0109n9gpvn	\N	6	2025	4000000	2025-11-06 20:54:07.572	2025-11-06 20:54:07.572
cmhnwn3cp003ynu01cwnp8r88	\N	7	2025	4000000	2025-11-06 20:54:17.017	2025-11-06 20:54:17.017
cmhnwn8la0040nu01dqctypeq	\N	8	2025	4000000	2025-11-06 20:54:23.806	2025-11-06 20:54:23.806
\.


--
-- Data for Name: reglas_comision; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.reglas_comision (id, "cantidadMinima", "cantidadMaxima", porcentaje, "comisionId", "createdAt", "updatedAt") FROM stdin;
cmhnqytsj000ynu01mehamyq5	1	\N	0.4	cmhnq6h2x0008nu016g7mjfs3	2025-11-06 18:15:26.803	2025-11-06 18:15:26.803
cmhnqzoqa0010nu01s8ww7wnz	4	\N	0.3	cmhnq5mm10006nu01dhusnl3i	2025-11-06 18:16:06.898	2025-11-06 18:16:06.898
cmhnr0ejt0012nu010rxqxjii	4	\N	0.37	cmhnq66q90007nu018g1z5a2k	2025-11-06 18:16:40.361	2025-11-06 18:16:40.361
\.


--
-- Data for Name: tipos_caracteristica; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.tipos_caracteristica (id, nombre, descripcion, activo, "createdAt", "updatedAt") FROM stdin;
cmho7ecax004pnu01psghtw4u	GYM	\N	t	2025-11-07 01:55:24.489	2025-11-07 01:55:24.489
cmhy90ijr00hxnu01lqzszy4t	Piscina	\N	t	2025-11-14 02:38:20.392	2025-11-14 02:38:20.392
\.


--
-- Data for Name: tipos_unidad_edificio; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.tipos_unidad_edificio (id, nombre, codigo, "comisionId", "createdAt", "updatedAt", "edificioId", bathrooms, bedrooms) FROM stdin;
cmho78pdj004knu01tzdlq5ld	1D1B(2C)	PUD1419	\N	2025-11-07 01:51:01.494	2025-11-07 01:51:01.494	cmho6hrs40046nu01bfsc5q74	\N	\N
cmho89ydo0053nu0125x8dy51	2D1B	3C	cmhnq5mm10006nu01dhusnl3i	2025-11-07 02:19:59.436	2025-11-07 02:19:59.436	cmho7x9nd004tnu01b6qtp6cp	\N	\N
cmho7yz10004vnu01o8h98hba	1D1B(2C)	2C	cmhnq5mm10006nu01dhusnl3i	2025-11-07 02:11:27.06	2025-11-07 02:26:42.39	cmho7x9nd004tnu01b6qtp6cp	\N	\N
cmhyd2e6800ianu01tgo9a9kf	2D1B(3C)	2D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-14 04:31:46.496	2025-11-14 04:31:46.496	cmhqlycri00apnu01bk6h8ytc	\N	\N
cmho8337h004znu01p47yl3fd	1D1B(2C)T	2CT	cmhnq5mm10006nu01dhusnl3i	2025-11-07 02:14:39.101	2025-11-07 02:27:16.499	cmho7x9nd004tnu01b6qtp6cp	\N	\N
cmho6va8l004gnu018p47ogml	2D1B(3C)-EST-BD	2D1B	cmhnq6h2x0008nu016g7mjfs3	2025-11-07 01:40:35.349	2025-11-07 13:08:58.371	cmho6kfpd0048nu01dejnnqby	\N	\N
cmhp278mv005knu016fkwtuty	1D1B (2C-T)	1D	cmhnq5mm10006nu01dhusnl3i	2025-11-07 16:17:41.24	2025-11-07 16:22:58.563	cmhp25oks005inu01w7kcs6y3	\N	\N
cmhp3epmm005qnu01dnesvxqh	1D1B (2C-T)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-07 16:51:29.471	2025-11-07 16:51:29.471	cmhp3dysm005onu01sqql8685	\N	\N
cmhp6ndc1006anu01q8xl0o8v	3D2B	3D2B	cmhnq5mm10006nu01dhusnl3i	2025-11-07 18:22:12.289	2025-11-07 18:22:12.289	cmhp6m9jm0068nu011rko89eo	\N	\N
cmhq9xbf3008snu01pzx9qptx	1D1B	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-08 12:41:41.391	2025-11-08 12:41:41.391	cmhnq8dih000anu01c9fvv5wa	\N	\N
cmhq9xlej008unu01zzyb2xq9	2D1B(3C)	2D1B(3C)	cmhnq5mm10006nu01dhusnl3i	2025-11-08 12:41:54.331	2025-11-08 12:41:54.331	cmhnq8dih000anu01c9fvv5wa	\N	\N
cmhq9xv6i008wnu01dnqgqkar	3D2B	3D2B	cmhnq5mm10006nu01dhusnl3i	2025-11-08 12:42:07.002	2025-11-08 12:42:07.002	cmhnq8dih000anu01c9fvv5wa	\N	\N
cmhqjfyu8009dnu01qpavj4em	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-08 17:08:08.096	2025-11-08 17:08:08.096	cmhpk8xtr008qnu019x41gwl0	\N	\N
cmhqjktdy009fnu01s8pqa1fz	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-08 17:11:54.31	2025-11-08 17:11:54.31	cmhpk80lu008onu010kwt0hkd	\N	\N
cmhtegbgc00avnu018ch26txd	2D2B(4C)	2D2B	cmhnq5mm10006nu01dhusnl3i	2025-11-10 17:11:44.892	2025-11-10 17:11:44.892	cmhnr8ixt001gnu01hxg12zab	\N	\N
cmhtzbo3v00b3nu01m3bi6b7d	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-11 02:55:59.947	2025-11-11 02:55:59.947	cmhnqkqfl000gnu01d267ux4k	\N	\N
cmhu08gho00b7nu01pcj2f190	2D1B(3C)	2D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-11 03:21:29.724	2025-11-11 03:32:41.948	cmhqlsxa700ahnu012p31d8zk	\N	\N
cmhuhy7c300bjnu01v6er6u14	3D2B	3D2B	cmhnq5mm10006nu01dhusnl3i	2025-11-11 11:37:24.387	2025-11-11 11:37:24.387	cmhnqwgx4000snu014paiyvsy	\N	\N
cmhxs40gh00c1nu01zmx6icv1	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 18:45:10.098	2025-11-13 18:45:10.098	cmhnucj51002gnu01usds4b2q	\N	\N
cmhxsgv8t00c9nu01lg9ofdig	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 18:55:09.869	2025-11-13 18:55:09.869	cmhqles44009vnu01na2oclxw	\N	\N
cmhxsp6j800chnu017qrb78qk	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 19:01:37.748	2025-11-13 19:01:37.748	cmhqlsxa700ahnu012p31d8zk	\N	\N
cmhxsv22300cpnu01wk1onvo8	2D1B(3C)	2D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 19:06:11.883	2025-11-13 19:06:11.883	cmhntz8k90028nu01ugx79exo	\N	\N
cmhxt3h4m00cxnu01yl9gyf0x	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 19:12:44.662	2025-11-13 19:12:44.662	cmhpjfauc007enu0115sfl1fr	\N	\N
cmhxuol0p00d6nu01lac2wpmo	Estudio	ESTUDIO	cmhnq5mm10006nu01dhusnl3i	2025-11-13 19:57:09.097	2025-11-13 19:57:09.097	cmhqlqf1d00adnu01wpybhb3n	\N	\N
cmhxw9cww00dwnu0102w3pndo	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 20:41:17.985	2025-11-13 20:41:17.985	cmhpjcjmy007cnu01eyofxb0s	\N	\N
cmhxwcb9v00e2nu01dcoc7oc9	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 20:43:35.827	2025-11-13 20:43:35.827	cmhqm00ye00atnu01jp66tctg	\N	\N
cmhxwe8ee00e6nu01arzcr20k	2D1B(3C)	2D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 20:45:05.414	2025-11-13 20:45:05.414	cmhpjfauc007enu0115sfl1fr	\N	\N
cmhxwuxzw00eanu017pc8s5hm	2D1B(3C)	2D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 20:58:05.084	2025-11-13 20:58:05.084	cmhpimhod006mnu011d07yoz8	\N	\N
cmhxwxs8700eenu01go077e4z	2D1B(3C)	2D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 21:00:17.575	2025-11-13 21:00:17.575	cmhqlz4jv00arnu016n7uf2hr	\N	\N
cmhy10n9900eqnu01cr2g55zn	Estudio	ESTUDIO	cmhnq5mm10006nu01dhusnl3i	2025-11-13 22:54:29.565	2025-11-13 22:54:29.565	cmhqlsxa700ahnu012p31d8zk	\N	\N
cmhy160vt00eunu018fjprccx	Estudio	ESTUDIO	cmhnq6h2x0008nu016g7mjfs3	2025-11-13 22:58:40.505	2025-11-13 22:58:40.505	cmho6dkgs0043nu01znb2hwj2	\N	\N
cmhy2o3wm00f8nu019gi60edx	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 23:40:43.846	2025-11-13 23:40:43.846	cmhntsbij0022nu014b2t07ew	\N	\N
cmhy2zkjb00fenu01rrh5yi4f	Estudio	ESTUDIO	cmhnq5mm10006nu01dhusnl3i	2025-11-13 23:49:38.615	2025-11-13 23:49:38.615	cmhqldboi009tnu01tz8tt54e	\N	\N
cmhy31xb300finu01na5i6lnp	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 23:51:28.479	2025-11-13 23:51:28.479	cmhqldboi009tnu01tz8tt54e	\N	\N
cmhy351rd00fonu01v2ayhso1	Estudio	ESTUDIO	cmhnq5mm10006nu01dhusnl3i	2025-11-13 23:53:54.218	2025-11-13 23:53:54.218	cmhpjrcwl007wnu017uokux3e	\N	\N
cmhy37d2900fsnu014n88ki33	2D2B(4C)	2D2B	cmhnq5mm10006nu01dhusnl3i	2025-11-13 23:55:42.178	2025-11-13 23:55:42.178	cmhp6m9jm0068nu011rko89eo	\N	\N
cmhy6odcz00h2nu01wph62inn	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-14 01:32:54.563	2025-11-14 01:32:54.563	cmhntz8k90028nu01ugx79exo	\N	\N
cmhy8tr2t00honu01m9akbbss	2D1B(3C)	2D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-14 02:33:04.854	2025-11-14 02:33:04.854	cmhqm00ye00atnu01jp66tctg	\N	\N
cmhy8ujr000hqnu01smk6cstw	3D2B	3D2B	cmhnq5mm10006nu01dhusnl3i	2025-11-14 02:33:42.012	2025-11-14 02:33:42.012	cmhqm00ye00atnu01jp66tctg	\N	\N
cmhyd270i00i8nu01fb5gqsxd	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-14 04:31:37.218	2025-11-14 04:31:37.218	cmhqlycri00apnu01bk6h8ytc	\N	\N
cmi0qs2xz00ignu01un5ta9qm	2D2B(4C)	2D2B	cmhnq5mm10006nu01dhusnl3i	2025-11-15 20:31:12.36	2025-11-15 20:31:12.36	cmhqlsxa700ahnu012p31d8zk	\N	\N
cmi0r4e6700isnu018xty1cui	2D2B(4C)	2D2B	cmhnq5mm10006nu01dhusnl3i	2025-11-15 20:40:46.783	2025-11-15 20:40:46.783	cmhpjfauc007enu0115sfl1fr	\N	\N
cmi0r72u800iwnu01f7lfseqv	Estudio	ESTUDIO	cmhnq5mm10006nu01dhusnl3i	2025-11-15 20:42:52.064	2025-11-15 20:42:52.064	cmhqllie900a5nu01ixagn9tc	\N	\N
cmi0ra2xs00j0nu01ichtv10x	Estudio	ESTUDIO	cmhnq5mm10006nu01dhusnl3i	2025-11-15 20:45:12.16	2025-11-15 20:45:12.16	cmho7x9nd004tnu01b6qtp6cp	\N	\N
cmi0rjaeu00j6nu01ciyudnwo	1D1B(2C)	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-15 20:52:21.751	2025-11-15 20:52:21.751	cmhpjrcwl007wnu017uokux3e	\N	\N
cmi50mzup00jinu01l5n6sk1x	1D1B	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-11-18 20:18:15.937	2025-11-18 20:18:15.937	cmhqlohjc00a9nu01edgo55zp	\N	\N
cmi57gpga00jtnu01748qkzem	1 Dormitorio	1D1B	\N	2025-11-18 23:29:19.834	2025-11-18 23:29:19.834	cmi57ey2j00jrnu01jnt4xikf	\N	\N
cmig9jnd200k1nu012zohfr53	1D1B	1D1B-T	cmhnq5mm10006nu01dhusnl3i	2025-11-26 17:13:04.262	2025-11-26 17:13:04.262	cmhpk5dbr008inu011j6b3rtw	\N	\N
cmioivt0c00kcnu011w9si8vt	1D1B	1D1B	cmhnq5mm10006nu01dhusnl3i	2025-12-02 11:56:37.404	2025-12-02 12:01:21.922	cmhpk5dbr008inu011j6b3rtw	\N	\N
\.


--
-- Data for Name: unidades; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.unidades (id, numero, estado, descripcion, metros2, "createdAt", "updatedAt", "edificioId", "tipoUnidadEdificioId") FROM stdin;
cmhxup0mx00d8nu01y7wi0ugb	NDVD309-B	RESERVADA	\N	29	2025-11-13 19:57:29.337	2025-11-13 19:59:55.204	cmhqlqf1d00adnu01wpybhb3n	cmhxuol0p00d6nu01lac2wpmo
cmho710qx004inu01tahcbass	310	DISPONIBLE	CUD310 / Garantía en tres cuotas, reajuste trimestral, 1/2 garantía de mascota	45	2025-11-07 01:45:02.984	2025-11-07 13:09:22.767	cmho6kfpd0048nu01dejnnqby	cmho6va8l004gnu018p47ogml
cmhp3iriw005unu01es88lq68	SRRD517	RESERVADA	\N	31	2025-11-07 16:54:38.552	2025-11-07 17:01:52.274	cmhp3dysm005onu01sqql8685	cmhp3epmm005qnu01dnesvxqh
cmhp28qty005mnu01i5rxo53w	VCUD512	RESERVADA	VCUD512	31.752	2025-11-07 16:18:51.478	2025-11-07 17:10:30.216	cmhp25oks005inu01w7kcs6y3	cmhp278mv005knu016fkwtuty
cmhp3fjht005snu01bpbn2u1u	SRRD206	RESERVADA	\N	33	2025-11-07 16:52:08.177	2025-11-07 17:18:19.681	cmhp3dysm005onu01sqql8685	cmhp3epmm005qnu01dnesvxqh
cmhp6o4ph006cnu01647590fb	CBLD1302	RESERVADA	\N	71	2025-11-07 18:22:47.765	2025-11-07 18:44:50.538	cmhp6m9jm0068nu011rko89eo	cmhp6ndc1006anu01q8xl0o8v
cmhqbekx9008ynu014ihir7ov	507	DISPONIBLE	\N	27.04	2025-11-08 13:23:06.477	2025-11-08 13:23:06.477	cmhnq8dih000anu01c9fvv5wa	cmhq9xbf3008snu01pzx9qptx
cmho79gcc004mnu010i8b1k1e	1419	RESERVADA	Garantía en tres cuotas, reajuste trimestral, 1/2 garantía de mascota	32	2025-11-07 01:51:36.444	2025-11-08 15:52:35.988	cmho6hrs40046nu01bfsc5q74	cmho78pdj004knu01tzdlq5ld
cmhqjlc56009hnu01bjipiwg5	PRLD604-B	RESERVADA	\N	31.87	2025-11-08 17:12:18.618	2025-11-08 17:16:13.783	cmhpk80lu008onu010kwt0hkd	cmhqjktdy009fnu01s8pqa1fz
cmhtej7d700axnu011ctiru94	304	RESERVADA	\N	5448	2025-11-10 17:13:59.563	2025-11-10 17:52:41.064	cmhnr8ixt001gnu01hxg12zab	cmhtegbgc00avnu018ch26txd
cmhxvazvw00denu01qndtzxe7	VECD812	RESERVADA	\N	32.5	2025-11-13 20:14:34.795	2025-11-13 20:22:48.62	cmhpjfauc007enu0115sfl1fr	cmhxt3h4m00cxnu01yl9gyf0x
cmhu0knqd00b9nu010p4bivji	RODD307	RESERVADA	\N	48.9	2025-11-11 03:30:58.981	2025-11-11 03:40:40.676	cmhqlsxa700ahnu012p31d8zk	cmhu08gho00b7nu01pcj2f190
cmhtzdbxd00b5nu01f1ocoybg	708	RESERVADA	\N	33.47	2025-11-11 02:57:17.473	2025-11-11 11:19:39.283	cmhnqkqfl000gnu01d267ux4k	cmhtzbo3v00b3nu01m3bi6b7d
cmhuhzkrs00blnu01zbltpfbg	AJMD1902	RESERVADA	\N	66.15	2025-11-11 11:38:28.456	2025-11-11 11:45:15.647	cmhnqwgx4000snu014paiyvsy	cmhuhy7c300bjnu01v6er6u14
cmhuwqzjz00brnu01d0h4rnw1	SRRD417	DISPONIBLE	\N	31	2025-11-11 18:31:41.951	2025-11-11 18:31:41.951	cmhp3dysm005onu01sqql8685	cmhp3epmm005qnu01dnesvxqh
cmhxs55lp00c3nu01hju1ny6y	ABRD1512	RESERVADA	\N	36	2025-11-13 18:46:03.422	2025-11-13 18:51:51.088	cmhnucj51002gnu01usds4b2q	cmhxs40gh00c1nu01zmx6icv1
cmhxshbqr00cbnu01vht2rxin	VNCD1419	RESERVADA	\N	34.5	2025-11-13 18:55:31.251	2025-11-13 19:00:12.614	cmhqles44009vnu01na2oclxw	cmhxsgv8t00c9nu01lg9ofdig
cmhxspo5j00cjnu01vzk1klbp	RODD210	RESERVADA	\N	29.75	2025-11-13 19:02:00.583	2025-11-13 19:04:41.719	cmhqlsxa700ahnu012p31d8zk	cmhxsp6j800chnu017qrb78qk
cmhxsvh4n00crnu018ajbtiw3	CCND1309	RESERVADA	\N	41.5	2025-11-13 19:06:31.415	2025-11-13 19:11:03.997	cmhntz8k90028nu01ugx79exo	cmhxsv22300cpnu01wk1onvo8
cmhxt3txo00cznu01k9rac6sk	VECD810	RESERVADA	\N	32.5	2025-11-13 19:13:01.261	2025-11-13 19:15:58.546	cmhpjfauc007enu0115sfl1fr	cmhxt3h4m00cxnu01yl9gyf0x
cmhxvckkz00dgnu01vqkgkyfs	VECD910	RESERVADA	\N	32.5	2025-11-13 20:15:48.275	2025-11-13 20:28:08.723	cmhpjfauc007enu0115sfl1fr	cmhxt3h4m00cxnu01yl9gyf0x
cmhxvdsyh00dinu01dnl3aa6v	VECD613	RESERVADA	\N	32.5	2025-11-13 20:16:45.785	2025-11-13 20:33:14.045	cmhpjfauc007enu0115sfl1fr	cmhxt3h4m00cxnu01yl9gyf0x
cmhxw9y3200dynu01v2ryeyyo	FLOD507	DISPONIBLE	\N	35.02	2025-11-13 20:41:45.422	2025-11-13 20:41:45.422	cmhpjcjmy007cnu01eyofxb0s	cmhxw9cww00dwnu0102w3pndo
cmhxwatet00e0nu01hzuu2jvz	FLOD306	DISPONIBLE	\N	33.95	2025-11-13 20:42:26.021	2025-11-13 20:42:26.021	cmhpjcjmy007cnu01eyofxb0s	cmhxw9cww00dwnu0102w3pndo
cmhxwcrju00e4nu01itbo6iph	VPQD105	DISPONIBLE	\N	32.78	2025-11-13 20:43:56.922	2025-11-13 20:43:56.922	cmhqm00ye00atnu01jp66tctg	cmhxwcb9v00e2nu01dcoc7oc9
cmhxwer4o00e8nu01cww2k2zt	VECD104	DISPONIBLE	\N	46	2025-11-13 20:45:29.688	2025-11-13 20:45:29.688	cmhpjfauc007enu0115sfl1fr	cmhxwe8ee00e6nu01arzcr20k
cmhxwy52b00egnu01itd6es5b	ZAND323-B	RESERVADA	\N	46	2025-11-13 21:00:34.211	2025-11-13 22:47:53.94	cmhqlz4jv00arnu016n7uf2hr	cmhxwxs8700eenu01go077e4z
cmhxwvd8y00ecnu01hj272slm	DPYD1204	RESERVADA	\N	41.85	2025-11-13 20:58:24.85	2025-11-13 22:50:56.026	cmhpimhod006mnu011d07yoz8	cmhxwuxzw00eanu017pc8s5hm
cmhy1198300esnu01xxbho7lc	RODD201	RESERVADA	\N	23.36	2025-11-13 22:54:58.035	2025-11-13 23:09:04.776	cmhqlsxa700ahnu012p31d8zk	cmhy10n9900eqnu01cr2g55zn
cmhy19dpr00eynu01mbzw3fds	SRRD620	RESERVADA	\N	32	2025-11-13 23:01:17.103	2025-11-13 23:12:21.127	cmhp3dysm005onu01sqql8685	cmhp3epmm005qnu01dnesvxqh
cmhy2ogva00fanu013zfv9q9d	AMGD208	DISPONIBLE	\N	32.72	2025-11-13 23:41:00.647	2025-11-13 23:41:00.647	cmhntsbij0022nu014b2t07ew	cmhy2o3wm00f8nu019gi60edx
cmhy389wr00funu0119r8lkdi	CBLD1407	DISPONIBLE	\N	55	2025-11-13 23:56:24.747	2025-11-13 23:56:24.747	cmhp6m9jm0068nu011rko89eo	cmhy37d2900fsnu014n88ki33
cmhy2vg9y00fcnu01q8bxc0g4	SRRD920	RESERVADA	\N	32	2025-11-13 23:46:26.47	2025-11-14 00:04:16.484	cmhp3dysm005onu01sqql8685	cmhp3epmm005qnu01dnesvxqh
cmhy2zx3f00fgnu01yiu4qydv	SNMD1212	RESERVADA	\N	23	2025-11-13 23:49:54.891	2025-11-14 00:09:40.052	cmhqldboi009tnu01tz8tt54e	cmhy2zkjb00fenu01rrh5yi4f
cmhy35c1w00fqnu01yhbxr9ot	DGOD1217	RESERVADA	\N	26.43	2025-11-13 23:54:07.556	2025-11-14 00:15:26.52	cmhpjrcwl007wnu017uokux3e	cmhy351rd00fonu01v2ayhso1
cmhy39cb600fwnu019sx7ygl8	CBLD1101	RESERVADA	\N	71	2025-11-13 23:57:14.514	2025-11-14 00:23:24.379	cmhp6m9jm0068nu011rko89eo	cmhp6ndc1006anu01q8xl0o8v
cmhy32d1y00fknu01ep6thzli	SNMD1107	RESERVADA	\N	31.5	2025-11-13 23:51:48.886	2025-11-14 00:30:48.271	cmhqldboi009tnu01tz8tt54e	cmhy31xb300finu01na5i6lnp
cmhy333bc00fmnu015sir30nq	SNMD311	RESERVADA	\N	34	2025-11-13 23:52:22.92	2025-11-14 00:35:05.722	cmhqldboi009tnu01tz8tt54e	cmhy31xb300finu01na5i6lnp
cmhy61m8800gqnu01esbtv5b9	VNCD910	RESERVADA	\N	34	2025-11-14 01:15:12.968	2025-11-14 01:18:20.458	cmhqles44009vnu01na2oclxw	cmhxsgv8t00c9nu01lg9ofdig
cmhy6dtyo00gwnu018i31hnfh	FLOD1611	RESERVADA	\N	32.94	2025-11-14 01:24:42.864	2025-11-14 01:28:05.27	cmhpjcjmy007cnu01eyofxb0s	cmhxw9cww00dwnu0102w3pndo
cmhy6ql2800h6nu01y4uphhvl	CCND1405	RESERVADA	\N	32	2025-11-14 01:34:37.857	2025-11-14 01:37:07.696	cmhntz8k90028nu01ugx79exo	cmhy6odcz00h2nu01wph62inn
cmhy6oso000h4nu01yiivib12	CCND1004	RESERVADA	\N	33	2025-11-14 01:33:14.4	2025-11-14 01:40:31.891	cmhntz8k90028nu01ugx79exo	cmhy6odcz00h2nu01wph62inn
cmhy7pwmu00hhnu01s1to60qg	IDPD1713A	RESERVADA	\N	40	2025-11-14 02:02:05.814	2025-11-14 02:04:22.021	cmho7x9nd004tnu01b6qtp6cp	cmho89ydo0053nu0125x8dy51
cmhy16qib00ewnu01fta8q0yz	701	RESERVADA	\N	28	2025-11-13 22:59:13.715	2025-11-14 04:19:17.465	cmho6dkgs0043nu01znb2hwj2	cmhy160vt00eunu018fjprccx
cmi0qn02l00ienu01bmmgiyt2	IDPD1108B	DISPONIBLE	\N	35.5	2025-11-15 20:27:15.357	2025-11-15 20:27:15.357	cmho7x9nd004tnu01b6qtp6cp	cmho7yz10004vnu01o8h98hba
cmho7zs3c004xnu01nayxsc32	IDPD1315A	DISPONIBLE	\N	30	2025-11-07 02:12:04.728	2025-11-15 20:27:39.694	cmho7x9nd004tnu01b6qtp6cp	cmho7yz10004vnu01o8h98hba
cmho83t6z0051nu01rcbv2q8p	IDPD1404A	DISPONIBLE	\N	31	2025-11-07 02:15:12.779	2025-11-15 20:27:48.311	cmho7x9nd004tnu01b6qtp6cp	cmho8337h004znu01p47yl3fd
cmho8ejxp0057nu0155jdo2a6	IDPD2213A	DISPONIBLE	 	40	2025-11-07 02:23:33.998	2025-11-15 20:47:29.993	cmho7x9nd004tnu01b6qtp6cp	cmho89ydo0053nu0125x8dy51
cmi0qspbc00iinu01y83kvobf	RODD306	DISPONIBLE	\N	48.9	2025-11-15 20:31:41.352	2025-11-15 20:31:41.352	cmhqlsxa700ahnu012p31d8zk	cmi0qs2xz00ignu01un5ta9qm
cmi0qug5600iknu01v914s05x	RODD337	DISPONIBLE	\N	23.37	2025-11-15 20:33:02.778	2025-11-15 20:33:02.778	cmhqlsxa700ahnu012p31d8zk	cmhy10n9900eqnu01cr2g55zn
cmi0qxiun00imnu0174q00zie	CCND807	DISPONIBLE	\N	33	2025-11-15 20:35:26.255	2025-11-15 20:35:26.255	cmhntz8k90028nu01ugx79exo	cmhy6odcz00h2nu01wph62inn
cmi0qz8b700ionu016zt6qrna	CCND704	DISPONIBLE	\N	33	2025-11-15 20:36:45.907	2025-11-15 20:36:45.907	cmhntz8k90028nu01ugx79exo	cmhy6odcz00h2nu01wph62inn
cmi0r1qkv00iqnu01vpkrhl0d	CCND611	DISPONIBLE	\N	32.5	2025-11-15 20:38:42.895	2025-11-15 20:38:42.895	cmhntz8k90028nu01ugx79exo	cmhy6odcz00h2nu01wph62inn
cmi0r4tkh00iunu01ewaqkkp4	VECD826	DISPONIBLE	\N	48	2025-11-15 20:41:06.738	2025-11-15 20:41:06.738	cmhpjfauc007enu0115sfl1fr	cmi0r4e6700isnu018xty1cui
cmi0r7rty00iynu01fvs3c06h	SRSD411	DISPONIBLE	\N	24.82	2025-11-15 20:43:24.454	2025-11-15 20:43:24.454	cmhqllie900a5nu01ixagn9tc	cmi0r72u800iwnu01f7lfseqv
cmho8bxwv0055nu01ld7y943d	IDPD1913A	DISPONIBLE	 	40	2025-11-07 02:21:32.143	2025-11-15 20:47:36.005	cmho7x9nd004tnu01b6qtp6cp	cmho89ydo0053nu0125x8dy51
cmi0radnm00j2nu01zkyxyi78	IDPD811A	DISPONIBLE	\N	32.5	2025-11-15 20:45:26.051	2025-11-15 20:47:47.881	cmho7x9nd004tnu01b6qtp6cp	cmho7yz10004vnu01o8h98hba
cmi0rg2hk00j4nu01gjxzgtfr	ABRD406	DISPONIBLE	\N	37	2025-11-15 20:49:51.513	2025-11-15 20:49:51.513	cmhnucj51002gnu01usds4b2q	cmhxs40gh00c1nu01zmx6icv1
cmi0rk6dk00j8nu01ofsjqsnr	DGOD320	DISPONIBLE	\N	30.28	2025-11-15 20:53:03.176	2025-11-15 20:53:03.176	cmhpjrcwl007wnu017uokux3e	cmi0rjaeu00j6nu01ciyudnwo
cmi50oar100jknu01m8zwc8yl	PRLD701-B	DISPONIBLE	\N	36	2025-11-18 20:19:16.717	2025-11-18 20:19:16.717	cmhqlohjc00a9nu01edgo55zp	cmi50mzup00jinu01l5n6sk1x
cmi57hdel00jvnu01y4fau5ud	407	DISPONIBLE	Torre sur	\N	2025-11-18 23:29:50.877	2025-11-18 23:29:50.877	cmi57ey2j00jrnu01jnt4xikf	cmi57gpga00jtnu01748qkzem
cmig9o85t00k3nu01jsrf1uks	MTCD807-A	RESERVADA	\N	37.3	2025-11-26 17:16:37.841	2025-11-26 17:27:36.192	cmhpk5dbr008inu011j6b3rtw	cmig9jnd200k1nu012zohfr53
cmioj4fqq00kenu01x0h6yjqk	807-A	RESERVADA	MTCD807-A	45	2025-12-02 12:03:20.115	2025-12-02 12:07:50.884	cmhpk5dbr008inu011j6b3rtw	cmig9jnd200k1nu012zohfr53
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: rumirent_prod
--

COPY public.users (id, email, password, nombre, rut, telefono, role, activo, "createdAt", "updatedAt", "birthDate") FROM stdin;
99248d96-6048-47ca-bd5a-c3112410c15d	admin@rumirent.com	$2b$10$IAe5rzH/qeq2cE5fg9.leuPXE6lffBOMB5iovJhon.Ou0GCkp4NKa	Admin User	123456-7	\N	ADMIN	t	2025-11-06 02:28:54.707	2025-11-06 02:28:54.707	\N
cmhnp489x0000nu01bdxkfmd1	argenis.recine@rumirent.com	$2b$12$pyUP3JVA5COXv5KKULMJveJ4Nf7YIkJ9DC/a/1mDCADpI75STvTty	Argenis Recine	26418299-9	+56 9 2862 8633	BROKER	t	2025-11-06 17:23:39.621	2025-11-06 17:23:39.621	1984-12-23 00:00:00
cmhnpclzs0001nu01fuix77i5	deisy@rumirent.com	$2b$12$zMXbn60/SuuzhoDYxUIkMu0nxL5Qbk3ALzule3J08nuCA0UdwlYwK	Deisy Montilla	25773403-K	+56 9 7859 9519	BROKER	t	2025-11-06 17:30:10.648	2025-11-06 17:30:10.648	1994-04-23 00:00:00
cmhnvdsvv002lnu01prp9jh1k	ana.molina@rumirent.com	$2b$12$OFADttDiakzowQOCvVpcqu3aVceA9zfi2BYfsmCoX6cVO1J.313Qm	Ana Molina	25978452-2	+56 9 6862 5078	BROKER	t	2025-11-06 20:19:03.931	2025-11-06 20:19:03.931	1986-08-18 00:00:00
cmhnvkfzb002mnu01ucwe72od	anny@rumirent.com	$2b$12$vAvHcivisq1qcKdC/9PicOkmHh2GK0Mfu.GO57jd71gnRPTq2xfIm	Anny Rodriguez	25119479-3	+56 9 4133 4117	BROKER	t	2025-11-06 20:24:13.799	2025-11-06 20:24:13.799	1992-04-21 00:00:00
cmhnvrdrp002nnu01z5ievfnn	constanza@rumirent.com	$2b$12$w42jaJ.EsHpSvGaotxaoYegubuxaTSzJVUhjBCFC1Xl/WUJShSmZi	Constanza Muñoz	19080261-2	+56 9 6877 6298	BROKER	t	2025-11-06 20:29:37.525	2025-11-06 20:29:37.525	1995-07-03 00:00:00
cmhnvy41q002onu018e4m0f5b	darwin@rumirent.com	$2b$12$5SU8yv.ir4wwT9ucW0xtOeg568S38/NUwtCFsNWJUPalOoFkO8QBe	Darwin Castillo	25920416-K	+56 9 7597 4415	BROKER	t	2025-11-06 20:34:51.518	2025-11-06 20:34:51.518	1992-12-23 00:00:00
cmhnwaeq9002pnu017u5x1dkt	ksalcedo@rumirent.com	$2b$12$STL.5VhRKtcJ5nuu9UavTuMwyIYSbXnahzoPl/yGiH2GoXewI.iOu	Ketty Salcedo	AW000375	+56 9 2830 8919	BROKER	t	2025-11-06 20:44:25.233	2025-11-06 20:44:25.233	1966-01-25 00:00:00
cmhnwgqkq002qnu017iz7yc97	maria.redondo@rumirent.com	$2b$12$e.yOYpCSdRA9eulzkI8IfOHX9VUc1gd3LrsWWHaKLwMQN67ApQReu	Maria de Lourdes Redondo	26285268-7	+56 9 6807 4541	BROKER	t	2025-11-06 20:49:20.523	2025-11-07 16:08:48.017	1989-04-08 00:00:00
cmhp20l9y005gnu01lxalm8ri	sinead@rumirent.com	$2b$12$jwRsgG9o3Nx0NoITUQ6Jxuc0sVIvDUHKUTfE.RMu.WjbB8Yd4S3Ni	Sinead Vasquez	25951158-5	+56 9 2077 0588	BROKER	t	2025-11-07 16:12:31.03	2025-11-07 16:12:31.03	1991-01-02 00:00:00
cmhqfksb1008znu01wxt3ekhx	duoinmobiliario@rumirent.com	$2b$12$X5lLgd1hpubNvtHJkDvXJ.SyJy0azm.vZaLRTqICTrwY4sVEWsNGi	Jaime Andrés Fung Angulo	27194614-7	+56 9 2397 3599	BROKER	t	2025-11-08 15:19:54.445	2025-11-08 15:19:54.445	1992-05-13 00:00:00
cmhqfovpd0091nu01mww6odbc	ymendez@rumirent.com	$2b$12$oYOcZkoCKEU0ENhEqb26sump0Yvjwppetk.sDHgkV0xu1Edg7eehi	Yurccelly Kepsuyeph Mendez de Jaramillo	21770169-4	+56 9 5005 6359	BROKER	t	2025-11-08 15:23:05.473	2025-11-08 15:23:05.473	1974-05-27 00:00:00
cmhqfwbvr0092nu01dhx88gr5	adalys@rumirent.com	$2b$12$CeehLauT5ga2Ksvz1xUGmOThX60TCw2ili.JXtFYlq7.I9zAxescC	Adalys Joseli Solórzano Hernández	25922407-1	+56 9 6563 8808	BROKER	t	2025-11-08 15:28:53.031	2025-11-08 15:28:53.031	1980-03-19 00:00:00
cmhqfxuyr0093nu0119bghb1v	alyiret@rumirent.com	$2b$12$0LdXdV0CO8gZNR.1MpXKROCayjv6vULiaU4UXmxgsP6ZjtIGhvz5.	Alyiret Dayana Camacho Jaimes	25664667-6	+56 9 4976 1240	BROKER	t	2025-11-08 15:30:04.419	2025-11-08 15:30:04.419	1986-10-05 00:00:00
cmhqfzjbq0094nu01qgazrahg	Sugeidy@rumirent.com	$2b$12$kAXgP7qZE08EChiCet/o7.Hp5xSpdz/nbM5kaswCD86fJg4WIhS3u	Sugeidy Carolina Millán Gómez	26272469-7	+56 9 5045 7407	BROKER	t	2025-11-08 15:31:22.646	2025-11-08 15:31:22.646	1994-09-22 00:00:00
cmhqfmabj0090nu01fb3tkeip	marlene@rumirent.com	$2b$12$O9nQKxL75vZOtinHPV.3Aubo8POWHw0AKx3nXbx54ydI06txqHHii	Marlene Andrea Diban Carvacho	12404486-3	+56 9 6805 4002	BROKER	t	2025-11-08 15:21:04.447	2025-11-08 15:32:11.652	1972-12-19 00:00:00
cmhqh4yyd009bnu01a3kogkmx	jyg@rumirent.com	$2b$12$hWgBuiv6rYyCGe.a4TAsauHKQDFM5PpADb.hWVcoVtEIAVkk9q2RC	Jesus Adrian Salazar alfonzo	25619528-3	+56 9 4873 8291	BROKER	t	2025-11-08 16:03:35.798	2025-11-08 16:03:35.798	1998-01-29 00:00:00
cmhya395y00i2nu017v8bgddm	henry@rumirent.com	$2b$12$zQdkGlvh3LxwpBPVUerQouDLL.CxVfc5fX7mpPjNBnV8F0/5TjWa.	Henry Colina	26.860 409-k	+56 9 3412 7225	ADMIN	t	2025-11-14 03:08:27.815	2025-11-14 03:08:27.815	1985-01-09 00:00:00
cmhy7mq9v00hfnu016zkghrx0	norien@rumirent.com	$2b$12$vxEm7qs/K0b5E42rs1xam.W0gue0MEF29LbBUaVzdOno5H044wiyW	Norien Yaroslav Sierraalta Marval	26886309-5	+56 9 3071 6733	BROKER	t	2025-11-14 01:59:37.604	2025-11-14 13:25:11.281	1980-11-18 00:00:00
cmihgixjx00k8nu01h7woxt2z	lisbeth@rumirent.com	$2b$12$s6qNURGKWC4.YBL8UBxBY.D.GaAaCicr0h4xjrBDA2EdcT.uEe0Ya	Lisbeth Carolina Sotillo Marcano	27326909-6	+56 9 2047 1266	BROKER	t	2025-11-27 13:16:14.301	2025-11-27 13:16:14.301	1990-01-12 00:00:00
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: cambios_comision_programados cambios_comision_programados_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.cambios_comision_programados
    ADD CONSTRAINT cambios_comision_programados_pkey PRIMARY KEY (id);


--
-- Name: caracteristicas_edificio caracteristicas_edificio_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.caracteristicas_edificio
    ADD CONSTRAINT caracteristicas_edificio_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: comisiones comisiones_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.comisiones
    ADD CONSTRAINT comisiones_pkey PRIMARY KEY (id);


--
-- Name: edificios edificios_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.edificios
    ADD CONSTRAINT edificios_pkey PRIMARY KEY (id);


--
-- Name: empresas empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);


--
-- Name: imagenes_edificio imagenes_edificio_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.imagenes_edificio
    ADD CONSTRAINT imagenes_edificio_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: metas_mensuales metas_mensuales_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.metas_mensuales
    ADD CONSTRAINT metas_mensuales_pkey PRIMARY KEY (id);


--
-- Name: reglas_comision reglas_comision_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.reglas_comision
    ADD CONSTRAINT reglas_comision_pkey PRIMARY KEY (id);


--
-- Name: tipos_caracteristica tipos_caracteristica_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.tipos_caracteristica
    ADD CONSTRAINT tipos_caracteristica_pkey PRIMARY KEY (id);


--
-- Name: tipos_unidad_edificio tipos_unidad_edificio_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.tipos_unidad_edificio
    ADD CONSTRAINT tipos_unidad_edificio_pkey PRIMARY KEY (id);


--
-- Name: unidades unidades_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT unidades_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: clientes_rut_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX clientes_rut_key ON public.clientes USING btree (rut);


--
-- Name: comisiones_codigo_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX comisiones_codigo_key ON public.comisiones USING btree (codigo);


--
-- Name: comisiones_nombre_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX comisiones_nombre_key ON public.comisiones USING btree (nombre);


--
-- Name: empresas_rut_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX empresas_rut_key ON public.empresas USING btree (rut);


--
-- Name: leads_unidadId_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX "leads_unidadId_key" ON public.leads USING btree ("unidadId");


--
-- Name: metas_mensuales_brokerId_mes_anio_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX "metas_mensuales_brokerId_mes_anio_key" ON public.metas_mensuales USING btree ("brokerId", mes, anio);


--
-- Name: tipos_caracteristica_nombre_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX tipos_caracteristica_nombre_key ON public.tipos_caracteristica USING btree (nombre);


--
-- Name: tipos_unidad_edificio_edificioId_codigo_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX "tipos_unidad_edificio_edificioId_codigo_key" ON public.tipos_unidad_edificio USING btree ("edificioId", codigo);


--
-- Name: unidades_edificioId_numero_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX "unidades_edificioId_numero_key" ON public.unidades USING btree ("edificioId", numero);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_rut_key; Type: INDEX; Schema: public; Owner: rumirent_prod
--

CREATE UNIQUE INDEX users_rut_key ON public.users USING btree (rut);


--
-- Name: cambios_comision_programados cambios_comision_programados_comisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.cambios_comision_programados
    ADD CONSTRAINT "cambios_comision_programados_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES public.comisiones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cambios_comision_programados cambios_comision_programados_edificioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.cambios_comision_programados
    ADD CONSTRAINT "cambios_comision_programados_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES public.edificios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cambios_comision_programados cambios_comision_programados_tipoUnidadEdificioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.cambios_comision_programados
    ADD CONSTRAINT "cambios_comision_programados_tipoUnidadEdificioId_fkey" FOREIGN KEY ("tipoUnidadEdificioId") REFERENCES public.tipos_unidad_edificio(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: caracteristicas_edificio caracteristicas_edificio_edificioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.caracteristicas_edificio
    ADD CONSTRAINT "caracteristicas_edificio_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES public.edificios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: caracteristicas_edificio caracteristicas_edificio_tipoCaracteristicaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.caracteristicas_edificio
    ADD CONSTRAINT "caracteristicas_edificio_tipoCaracteristicaId_fkey" FOREIGN KEY ("tipoCaracteristicaId") REFERENCES public.tipos_caracteristica(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: clientes clientes_brokerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT "clientes_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: edificios edificios_comisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.edificios
    ADD CONSTRAINT "edificios_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES public.comisiones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: edificios edificios_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.edificios
    ADD CONSTRAINT "edificios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public.empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: imagenes_edificio imagenes_edificio_edificioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.imagenes_edificio
    ADD CONSTRAINT "imagenes_edificio_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES public.edificios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leads leads_brokerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: leads leads_clienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES public.clientes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: leads leads_comisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES public.comisiones(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leads leads_edificioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES public.edificios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: leads leads_reglaComisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_reglaComisionId_fkey" FOREIGN KEY ("reglaComisionId") REFERENCES public.reglas_comision(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leads leads_tipoUnidadEdificioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_tipoUnidadEdificioId_fkey" FOREIGN KEY ("tipoUnidadEdificioId") REFERENCES public.tipos_unidad_edificio(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leads leads_unidadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT "leads_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES public.unidades(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: metas_mensuales metas_mensuales_brokerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.metas_mensuales
    ADD CONSTRAINT "metas_mensuales_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reglas_comision reglas_comision_comisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.reglas_comision
    ADD CONSTRAINT "reglas_comision_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES public.comisiones(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tipos_unidad_edificio tipos_unidad_edificio_comisionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.tipos_unidad_edificio
    ADD CONSTRAINT "tipos_unidad_edificio_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES public.comisiones(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tipos_unidad_edificio tipos_unidad_edificio_edificioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.tipos_unidad_edificio
    ADD CONSTRAINT "tipos_unidad_edificio_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES public.edificios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: unidades unidades_edificioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT "unidades_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES public.edificios(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: unidades unidades_tipoUnidadEdificioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rumirent_prod
--

ALTER TABLE ONLY public.unidades
    ADD CONSTRAINT "unidades_tipoUnidadEdificioId_fkey" FOREIGN KEY ("tipoUnidadEdificioId") REFERENCES public.tipos_unidad_edificio(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict RF5TACuA8yO3PdqRULBB19fpzEhPb4OjrUonalpbG4GEMNILW4fJvDy5d0LIcr9

