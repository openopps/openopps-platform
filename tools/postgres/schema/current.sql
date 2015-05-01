--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner:
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: attachment; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE attachment (
    "fileId" integer,
    "projectId" integer,
    "taskId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE attachment OWNER TO midas;

--
-- Name: attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE attachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE attachment_id_seq OWNER TO midas;

--
-- Name: attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE attachment_id_seq OWNED BY attachment.id;


--
-- Name: comment; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE comment (
    topic boolean,
    "projectId" integer,
    "taskId" integer,
    "parentId" integer,
    "userId" integer,
    value text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE comment OWNER TO midas;

--
-- Name: comment_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE comment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE comment_id_seq OWNER TO midas;

--
-- Name: comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE comment_id_seq OWNED BY comment.id;


--
-- Name: delivery; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE delivery (
    "notificationId" integer,
    "deliveryDate" timestamp with time zone,
    "deliveryType" text,
    content text,
    "isDelivered" boolean,
    "isActive" boolean,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE delivery OWNER TO midas;

--
-- Name: delivery_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE delivery_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE delivery_id_seq OWNER TO midas;

--
-- Name: delivery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE delivery_id_seq OWNED BY delivery.id;


--
-- Name: event; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE event (
    status text,
    uuid text,
    title text,
    description text,
    start timestamp with time zone,
    "end" timestamp with time zone,
    location text,
    "userId" integer,
    "projectId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE event OWNER TO midas;

--
-- Name: event_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE event_id_seq OWNER TO midas;

--
-- Name: event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE event_id_seq OWNED BY event.id;


--
-- Name: eventrsvp; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE eventrsvp (
    "eventId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE eventrsvp OWNER TO midas;

--
-- Name: eventrsvp_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE eventrsvp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE eventrsvp_id_seq OWNER TO midas;

--
-- Name: eventrsvp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE eventrsvp_id_seq OWNED BY eventrsvp.id;


--
-- Name: file; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE file (
    "userId" integer,
    name text,
    "isPrivate" boolean,
    "mimeType" text,
    size integer,
    data bytea,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE file OWNER TO midas;

--
-- Name: file_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE file_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE file_id_seq OWNER TO midas;

--
-- Name: file_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE file_id_seq OWNED BY file.id;


--
-- Name: like; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE "like" (
    "projectId" integer,
    "taskId" integer,
    "targetId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE "like" OWNER TO midas;

--
-- Name: like_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE like_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE like_id_seq OWNER TO midas;

--
-- Name: like_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE like_id_seq OWNED BY "like".id;


--
-- Name: midas_user; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE midas_user (
    username text,
    name text,
    title text,
    bio text,
    "photoId" integer,
    "photoUrl" text,
    "isAdmin" boolean,
    disabled boolean,
    "passwordAttempts" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE midas_user OWNER TO midas;

--
-- Name: midas_user_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE midas_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE midas_user_id_seq OWNER TO midas;

--
-- Name: midas_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE midas_user_id_seq OWNED BY midas_user.id;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE notification (
    "callerId" integer,
    "callerType" text,
    "triggerGuid" text,
    action text,
    audience text,
    "recipientId" integer,
    "createdDate" timestamp with time zone,
    "localParams" text,
    "globalParams" text,
    "isActive" boolean,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE notification OWNER TO midas;

--
-- Name: notification_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE notification_id_seq OWNER TO midas;

--
-- Name: notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE notification_id_seq OWNED BY notification.id;


--
-- Name: project; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE project (
    state text,
    title text,
    description text,
    "coverId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE project OWNER TO midas;

--
-- Name: project_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE project_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE project_id_seq OWNER TO midas;

--
-- Name: project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE project_id_seq OWNED BY project.id;


--
-- Name: project_tags__tagentity_projects; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE project_tags__tagentity_projects (
    id integer NOT NULL,
    project_tags integer,
    tagentity_projects integer,
    "deletedAt" timestamp with time zone
);


ALTER TABLE project_tags__tagentity_projects OWNER TO midas;

--
-- Name: project_tags__tagentity_projects_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE project_tags__tagentity_projects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE project_tags__tagentity_projects_id_seq OWNER TO midas;

--
-- Name: project_tags__tagentity_projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE project_tags__tagentity_projects_id_seq OWNED BY project_tags__tagentity_projects.id;


--
-- Name: projectowner; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE projectowner (
    "projectId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE projectowner OWNER TO midas;

--
-- Name: projectowner_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE projectowner_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE projectowner_id_seq OWNER TO midas;

--
-- Name: projectowner_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE projectowner_id_seq OWNED BY projectowner.id;


--
-- Name: projectparticipant; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE projectparticipant (
    "projectId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE projectparticipant OWNER TO midas;

--
-- Name: projectparticipant_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE projectparticipant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE projectparticipant_id_seq OWNER TO midas;

--
-- Name: projectparticipant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE projectparticipant_id_seq OWNED BY projectparticipant.id;


--
-- Name: projecttag; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE projecttag (
    "projectId" integer,
    "tagId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE projecttag OWNER TO midas;

--
-- Name: projecttag_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE projecttag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE projecttag_id_seq OWNER TO midas;

--
-- Name: projecttag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE projecttag_id_seq OWNED BY projecttag.id;


--
-- Name: schema; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE schema (
    schema character varying,
    version integer
);


ALTER TABLE schema OWNER TO midas;

--
-- Name: session; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE session OWNER TO midas;

--
-- Name: tag; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE tag (
    "projectId" integer,
    "taskId" integer,
    "tagId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE tag OWNER TO midas;

--
-- Name: tag_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tag_id_seq OWNER TO midas;

--
-- Name: tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE tag_id_seq OWNED BY tag.id;


--
-- Name: tagentity; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE tagentity (
    type text,
    name text,
    data json,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE tagentity OWNER TO midas;

--
-- Name: tagentity_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE tagentity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tagentity_id_seq OWNER TO midas;

--
-- Name: tagentity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE tagentity_id_seq OWNED BY tagentity.id;


--
-- Name: tagentity_tasks__task_tags; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE tagentity_tasks__task_tags (
    id integer NOT NULL,
    tagentity_tasks integer,
    task_tags integer,
    "deletedAt" timestamp with time zone
);


ALTER TABLE tagentity_tasks__task_tags OWNER TO midas;

--
-- Name: tagentity_tasks__task_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE tagentity_tasks__task_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tagentity_tasks__task_tags_id_seq OWNER TO midas;

--
-- Name: tagentity_tasks__task_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE tagentity_tasks__task_tags_id_seq OWNED BY tagentity_tasks__task_tags.id;


--
-- Name: tagentity_users__user_tags; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE tagentity_users__user_tags (
    id integer NOT NULL,
    tagentity_users integer,
    user_tags integer,
    "deletedAt" timestamp with time zone
);


ALTER TABLE tagentity_users__user_tags OWNER TO midas;

--
-- Name: tagentity_users__user_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE tagentity_users__user_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tagentity_users__user_tags_id_seq OWNER TO midas;

--
-- Name: tagentity_users__user_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE tagentity_users__user_tags_id_seq OWNED BY tagentity_users__user_tags.id;


--
-- Name: task; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE task (
    state text,
    "userId" integer,
    "projectId" integer,
    title text,
    description text,
    "publishedAt" timestamp with time zone,
    "assignedAt" timestamp with time zone,
    "completedAt" timestamp with time zone,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE task OWNER TO midas;

--
-- Name: task_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE task_id_seq OWNER TO midas;

--
-- Name: task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE task_id_seq OWNED BY task.id;


--
-- Name: userauth; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE userauth (
    "userId" integer,
    provider text,
    "providerId" text,
    "accessToken" text,
    "refreshToken" text,
    "refreshTime" timestamp with time zone,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE userauth OWNER TO midas;

--
-- Name: userauth_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE userauth_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE userauth_id_seq OWNER TO midas;

--
-- Name: userauth_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE userauth_id_seq OWNED BY userauth.id;


--
-- Name: useremail; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE useremail (
    "userId" integer,
    email text,
    "isPrimary" boolean,
    "isVerified" boolean,
    token text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE useremail OWNER TO midas;

--
-- Name: useremail_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE useremail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE useremail_id_seq OWNER TO midas;

--
-- Name: useremail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE useremail_id_seq OWNED BY useremail.id;


--
-- Name: usernotification; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE usernotification (
    "userId" integer,
    "notificationId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE usernotification OWNER TO midas;

--
-- Name: usernotification_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE usernotification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE usernotification_id_seq OWNER TO midas;

--
-- Name: usernotification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE usernotification_id_seq OWNED BY usernotification.id;


--
-- Name: userpassword; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE userpassword (
    "userId" integer,
    password text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE userpassword OWNER TO midas;

--
-- Name: userpassword_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE userpassword_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE userpassword_id_seq OWNER TO midas;

--
-- Name: userpassword_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE userpassword_id_seq OWNED BY userpassword.id;


--
-- Name: userpasswordreset; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE userpasswordreset (
    "userId" integer,
    token text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE userpasswordreset OWNER TO midas;

--
-- Name: userpasswordreset_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE userpasswordreset_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE userpasswordreset_id_seq OWNER TO midas;

--
-- Name: userpasswordreset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE userpasswordreset_id_seq OWNED BY userpasswordreset.id;


--
-- Name: usersetting; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE usersetting (
    "userId" integer,
    context text,
    key text,
    value text,
    "isActive" boolean,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE usersetting OWNER TO midas;

--
-- Name: usersetting_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE usersetting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE usersetting_id_seq OWNER TO midas;

--
-- Name: usersetting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE usersetting_id_seq OWNED BY usersetting.id;


--
-- Name: volunteer; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE volunteer (
    "taskId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


ALTER TABLE volunteer OWNER TO midas;

--
-- Name: volunteer_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

CREATE SEQUENCE volunteer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE volunteer_id_seq OWNER TO midas;

--
-- Name: volunteer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE volunteer_id_seq OWNED BY volunteer.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY attachment ALTER COLUMN id SET DEFAULT nextval('attachment_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY comment ALTER COLUMN id SET DEFAULT nextval('comment_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY delivery ALTER COLUMN id SET DEFAULT nextval('delivery_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY event ALTER COLUMN id SET DEFAULT nextval('event_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY eventrsvp ALTER COLUMN id SET DEFAULT nextval('eventrsvp_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY file ALTER COLUMN id SET DEFAULT nextval('file_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY "like" ALTER COLUMN id SET DEFAULT nextval('like_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY midas_user ALTER COLUMN id SET DEFAULT nextval('midas_user_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY notification ALTER COLUMN id SET DEFAULT nextval('notification_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY project ALTER COLUMN id SET DEFAULT nextval('project_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY project_tags__tagentity_projects ALTER COLUMN id SET DEFAULT nextval('project_tags__tagentity_projects_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY projectowner ALTER COLUMN id SET DEFAULT nextval('projectowner_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY projectparticipant ALTER COLUMN id SET DEFAULT nextval('projectparticipant_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY projecttag ALTER COLUMN id SET DEFAULT nextval('projecttag_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY tag ALTER COLUMN id SET DEFAULT nextval('tag_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY tagentity ALTER COLUMN id SET DEFAULT nextval('tagentity_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY tagentity_tasks__task_tags ALTER COLUMN id SET DEFAULT nextval('tagentity_tasks__task_tags_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY tagentity_users__user_tags ALTER COLUMN id SET DEFAULT nextval('tagentity_users__user_tags_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY task ALTER COLUMN id SET DEFAULT nextval('task_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY userauth ALTER COLUMN id SET DEFAULT nextval('userauth_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY useremail ALTER COLUMN id SET DEFAULT nextval('useremail_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY usernotification ALTER COLUMN id SET DEFAULT nextval('usernotification_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY userpassword ALTER COLUMN id SET DEFAULT nextval('userpassword_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY userpasswordreset ALTER COLUMN id SET DEFAULT nextval('userpasswordreset_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY usersetting ALTER COLUMN id SET DEFAULT nextval('usersetting_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY volunteer ALTER COLUMN id SET DEFAULT nextval('volunteer_id_seq'::regclass);


--
-- Name: attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY attachment
    ADD CONSTRAINT attachment_pkey PRIMARY KEY (id);


--
-- Name: comment_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY comment
    ADD CONSTRAINT comment_pkey PRIMARY KEY (id);


--
-- Name: delivery_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY delivery
    ADD CONSTRAINT delivery_pkey PRIMARY KEY (id);


--
-- Name: event_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_pkey PRIMARY KEY (id);


--
-- Name: eventrsvp_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY eventrsvp
    ADD CONSTRAINT eventrsvp_pkey PRIMARY KEY (id);


--
-- Name: file_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_pkey PRIMARY KEY (id);


--
-- Name: like_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY "like"
    ADD CONSTRAINT like_pkey PRIMARY KEY (id);


--
-- Name: midas_user_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY midas_user
    ADD CONSTRAINT midas_user_pkey PRIMARY KEY (id);


--
-- Name: midas_user_username_key; Type: CONSTRAINT; Schema: public; Owner: midas; ablespace:
--

ALTER TABLE ONLY midas_user
    ADD CONSTRAINT midas_user_username_key UNIQUE (username);


--
-- Name: notification_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: project_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


--
-- Name: project_tags__tagentity_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY project_tags__tagentity_projects
    ADD CONSTRAINT project_tags__tagentity_projects_pkey PRIMARY KEY (id);


--
-- Name: projectowner_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY projectowner
    ADD CONSTRAINT projectowner_pkey PRIMARY KEY (id);


--
-- Name: projectparticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY projectparticipant
    ADD CONSTRAINT projectparticipant_pkey PRIMARY KEY (id);


--
-- Name: projecttag_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY projecttag
    ADD CONSTRAINT projecttag_pkey PRIMARY KEY (id);


--
-- Name: session_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: tag_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (id);


--
-- Name: tagentity_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY tagentity
    ADD CONSTRAINT tagentity_pkey PRIMARY KEY (id);


--
-- Name: tagentity_tasks__task_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY tagentity_tasks__task_tags
    ADD CONSTRAINT tagentity_tasks__task_tags_pkey PRIMARY KEY (id);


--
-- Name: tagentity_users__user_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY tagentity_users__user_tags
    ADD CONSTRAINT tagentity_users__user_tags_pkey PRIMARY KEY (id);


--
-- Name: task_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- Name: userauth_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY userauth
    ADD CONSTRAINT userauth_pkey PRIMARY KEY (id);


--
-- Name: useremail_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY useremail
    ADD CONSTRAINT useremail_pkey PRIMARY KEY (id);


--
-- Name: usernotification_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY usernotification
    ADD CONSTRAINT usernotification_pkey PRIMARY KEY (id);


--
-- Name: userpassword_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY userpassword
    ADD CONSTRAINT userpassword_pkey PRIMARY KEY (id);


--
-- Name: userpasswordreset_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY userpasswordreset
    ADD CONSTRAINT userpasswordreset_pkey PRIMARY KEY (id);


--
-- Name: usersetting_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY usersetting
    ADD CONSTRAINT usersetting_pkey PRIMARY KEY (id);


--
-- Name: volunteer_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--

ALTER TABLE ONLY volunteer
    ADD CONSTRAINT volunteer_pkey PRIMARY KEY (id);


--
-- Name: public; Type: ACL; Schema: -; Owner: midas
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM midas;
GRANT ALL ON SCHEMA public TO midas;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--
