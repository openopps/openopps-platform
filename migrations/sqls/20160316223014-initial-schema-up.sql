--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: attachment; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS attachment (
    "fileId" integer,
    "projectId" integer,
    "taskId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE attachment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE attachment_id_seq OWNED BY attachment.id;


--
-- Name: badge; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS badge (
    "user" integer,
    task integer,
    id integer NOT NULL,
    type character varying,
    silent boolean DEFAULT false,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: badge_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE badge_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: badge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE badge_id_seq OWNED BY badge.id;


--
-- Name: comment; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS comment (
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


--
-- Name: comment_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE comment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE comment_id_seq OWNED BY comment.id;


--
-- Name: delivery; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS delivery (
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


--
-- Name: delivery_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE delivery_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: delivery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE delivery_id_seq OWNED BY delivery.id;


--
-- Name: event; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS event (
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


--
-- Name: event_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE event_id_seq OWNED BY event.id;


--
-- Name: eventrsvp; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS eventrsvp (
    "eventId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: eventrsvp_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE eventrsvp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: eventrsvp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE eventrsvp_id_seq OWNED BY eventrsvp.id;


--
-- Name: file; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS file (
    "userId" integer,
    name text,
    "isPrivate" boolean,
    "mimeType" text,
    size integer,
    data bytea,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone,
    fd character varying
);


--
-- Name: file_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE file_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: file_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE file_id_seq OWNED BY file.id;


--
-- Name: like; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS "like" (
    "projectId" integer,
    "taskId" integer,
    "targetId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: like_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE like_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: like_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE like_id_seq OWNED BY "like".id;


--
-- Name: midas_user; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS midas_user (
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
    "deletedAt" timestamp with time zone,
    "completedTasks" integer DEFAULT 0 NOT NULL
);


--
-- Name: midas_user_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE midas_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: midas_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE midas_user_id_seq OWNED BY midas_user.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    run_on timestamp without time zone NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE migrations_id_seq OWNED BY migrations.id;


--
-- Name: notification; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS notification (
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
    "deletedAt" timestamp with time zone,
    model json
);


--
-- Name: notification_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE notification_id_seq OWNED BY notification.id;


--
-- Name: passport; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS passport (
    protocol text,
    password text,
    "accessToken" text,
    provider text,
    identifier text,
    tokens json,
    "user" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: passport_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE passport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: passport_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE passport_id_seq OWNED BY passport.id;


--
-- Name: project; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS project (
    state text,
    title text,
    description text,
    "coverId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: project_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE project_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE project_id_seq OWNED BY project.id;


--
-- Name: project_tags__tagentity_projects; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS project_tags__tagentity_projects (
    id integer NOT NULL,
    project_tags integer,
    tagentity_projects integer,
    "deletedAt" timestamp with time zone
);


--
-- Name: project_tags__tagentity_projects_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE project_tags__tagentity_projects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: project_tags__tagentity_projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE project_tags__tagentity_projects_id_seq OWNED BY project_tags__tagentity_projects.id;


--
-- Name: projectowner; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS projectowner (
    "projectId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: projectowner_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE projectowner_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: projectowner_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE projectowner_id_seq OWNED BY projectowner.id;


--
-- Name: projectparticipant; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS projectparticipant (
    "projectId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: projectparticipant_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE projectparticipant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: projectparticipant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE projectparticipant_id_seq OWNED BY projectparticipant.id;


--
-- Name: projecttag; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS projecttag (
    "projectId" integer,
    "tagId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: projecttag_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE projecttag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: projecttag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE projecttag_id_seq OWNED BY projecttag.id;


--
-- Name: schema; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS schema (
    schema character varying,
    version integer
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: tag; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS tag (
    "projectId" integer,
    "taskId" integer,
    "tagId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: tag_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE tag_id_seq OWNED BY tag.id;


--
-- Name: tagentity; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS tagentity (
    type text,
    name text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone,
    data json
);


--
-- Name: tagentity_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE tagentity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: tagentity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE tagentity_id_seq OWNED BY tagentity.id;


--
-- Name: tagentity_tasks__task_tags; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS tagentity_tasks__task_tags (
    id integer NOT NULL,
    tagentity_tasks integer,
    task_tags integer,
    "deletedAt" timestamp with time zone
);


--
-- Name: tagentity_tasks__task_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE tagentity_tasks__task_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: tagentity_tasks__task_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE tagentity_tasks__task_tags_id_seq OWNED BY tagentity_tasks__task_tags.id;


--
-- Name: tagentity_users__user_tags; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS tagentity_users__user_tags (
    id integer NOT NULL,
    tagentity_users integer,
    user_tags integer,
    "deletedAt" timestamp with time zone
);


--
-- Name: tagentity_users__user_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE tagentity_users__user_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: tagentity_users__user_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE tagentity_users__user_tags_id_seq OWNED BY tagentity_users__user_tags.id;


--
-- Name: task; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS task (
    state text,
    "userId" integer,
    "projectId" integer,
    title text,
    description text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone,
    "publishedAt" timestamp with time zone,
    "assignedAt" timestamp with time zone,
    "completedAt" timestamp with time zone,
    "completedBy" timestamp with time zone,
    "submittedAt" timestamp with time zone
);


--
-- Name: task_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE task_id_seq OWNED BY task.id;


--
-- Name: userauth; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS userauth (
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


--
-- Name: userauth_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE userauth_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: userauth_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE userauth_id_seq OWNED BY userauth.id;


--
-- Name: useremail; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS useremail (
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


--
-- Name: useremail_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE useremail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: useremail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE useremail_id_seq OWNED BY useremail.id;


--
-- Name: usernotification; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS usernotification (
    "userId" integer,
    "notificationId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: usernotification_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE usernotification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: usernotification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE usernotification_id_seq OWNED BY usernotification.id;


--
-- Name: userpassword; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS userpassword (
    "userId" integer,
    password text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: userpassword_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE userpassword_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: userpassword_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE userpassword_id_seq OWNED BY userpassword.id;


--
-- Name: userpasswordreset; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS userpasswordreset (
    "userId" integer,
    token text,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone
);


--
-- Name: userpasswordreset_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE userpasswordreset_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: userpasswordreset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE userpasswordreset_id_seq OWNED BY userpasswordreset.id;


--
-- Name: usersetting; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS usersetting (
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


--
-- Name: usersetting_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE usersetting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


--
-- Name: usersetting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: midas
--

ALTER SEQUENCE usersetting_id_seq OWNED BY usersetting.id;


--
-- Name: volunteer; Type: TABLE; Schema: public; Owner: midas; Tablespace:
--

CREATE TABLE IF NOT EXISTS volunteer (
    "taskId" integer,
    "userId" integer,
    id integer NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone,
    silent boolean
);


--
-- Name: volunteer_id_seq; Type: SEQUENCE; Schema: public; Owner: midas
--

DO
$$
BEGIN
CREATE SEQUENCE volunteer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
EXCEPTION WHEN duplicate_table THEN
END
$$ LANGUAGE plpgsql;


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

ALTER TABLE ONLY badge ALTER COLUMN id SET DEFAULT nextval('badge_id_seq'::regclass);


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

ALTER TABLE ONLY migrations ALTER COLUMN id SET DEFAULT nextval('migrations_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY notification ALTER COLUMN id SET DEFAULT nextval('notification_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: midas
--

ALTER TABLE ONLY passport ALTER COLUMN id SET DEFAULT nextval('passport_id_seq'::regclass);


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
ALTER TABLE attachment DROP CONSTRAINT IF EXISTS attachment_pkey;
ALTER TABLE ONLY attachment
    ADD CONSTRAINT attachment_pkey PRIMARY KEY (id);


--
-- Name: comment_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE comment DROP CONSTRAINT IF EXISTS comment_pkey;
ALTER TABLE ONLY comment
    ADD CONSTRAINT comment_pkey PRIMARY KEY (id);


--
-- Name: delivery_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE delivery DROP CONSTRAINT IF EXISTS delivery_pkey;
ALTER TABLE ONLY delivery
    ADD CONSTRAINT delivery_pkey PRIMARY KEY (id);


--
-- Name: event_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE event DROP CONSTRAINT IF EXISTS event_pkey;
ALTER TABLE ONLY event
    ADD CONSTRAINT event_pkey PRIMARY KEY (id);


--
-- Name: eventrsvp_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE eventrsvp DROP CONSTRAINT IF EXISTS eventrsvp_pkey;
ALTER TABLE ONLY eventrsvp
    ADD CONSTRAINT eventrsvp_pkey PRIMARY KEY (id);


--
-- Name: file_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE file DROP CONSTRAINT IF EXISTS file_pkey;
ALTER TABLE ONLY file
    ADD CONSTRAINT file_pkey PRIMARY KEY (id);


--
-- Name: like_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE "like" DROP CONSTRAINT IF EXISTS like_pkey;
ALTER TABLE ONLY "like"
    ADD CONSTRAINT like_pkey PRIMARY KEY (id);


--
-- Name: midas_user_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE midas_user DROP CONSTRAINT IF EXISTS midas_user_pkey;
ALTER TABLE ONLY midas_user
    ADD CONSTRAINT midas_user_pkey PRIMARY KEY (id);


--
-- Name: midas_user_username_key; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE midas_user DROP CONSTRAINT IF EXISTS midas_user_username_key;
ALTER TABLE ONLY midas_user
    ADD CONSTRAINT midas_user_username_key UNIQUE (username);


--
-- Name: migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE migrations DROP CONSTRAINT IF EXISTS migrations_pkey;
ALTER TABLE ONLY migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: notification_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE notification DROP CONSTRAINT IF EXISTS notification_pkey;
ALTER TABLE ONLY notification
    ADD CONSTRAINT notification_pkey PRIMARY KEY (id);


--
-- Name: passport_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE passport DROP CONSTRAINT IF EXISTS passport_pkey;
ALTER TABLE ONLY passport
    ADD CONSTRAINT passport_pkey PRIMARY KEY (id);


--
-- Name: project_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE project DROP CONSTRAINT IF EXISTS project_pkey;
ALTER TABLE ONLY project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


--
-- Name: project_tags__tagentity_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE project_tags__tagentity_projects DROP CONSTRAINT IF EXISTS project_tags__tagentity_projects_pkey;
ALTER TABLE ONLY project_tags__tagentity_projects
    ADD CONSTRAINT project_tags__tagentity_projects_pkey PRIMARY KEY (id);


--
-- Name: projectowner_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE projectowner DROP CONSTRAINT IF EXISTS projectowner_pkey;
ALTER TABLE ONLY projectowner
    ADD CONSTRAINT projectowner_pkey PRIMARY KEY (id);


--
-- Name: projectparticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE projectparticipant DROP CONSTRAINT IF EXISTS projectparticipant_pkey;
ALTER TABLE ONLY projectparticipant
    ADD CONSTRAINT projectparticipant_pkey PRIMARY KEY (id);


--
-- Name: projecttag_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE projecttag DROP CONSTRAINT IF EXISTS projecttag_pkey;
ALTER TABLE ONLY projecttag
    ADD CONSTRAINT projecttag_pkey PRIMARY KEY (id);


--
-- Name: session_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE ONLY session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: tag_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE tag DROP CONSTRAINT IF EXISTS tag_pkey;
ALTER TABLE ONLY tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (id);


--
-- Name: tagentity_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE tagentity DROP CONSTRAINT IF EXISTS tagentity_pkey;
ALTER TABLE ONLY tagentity
    ADD CONSTRAINT tagentity_pkey PRIMARY KEY (id);


--
-- Name: tagentity_tasks__task_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE tagentity_tasks__task_tags DROP CONSTRAINT IF EXISTS tagentity_tasks__task_tags_pkey;
ALTER TABLE ONLY tagentity_tasks__task_tags
    ADD CONSTRAINT tagentity_tasks__task_tags_pkey PRIMARY KEY (id);


--
-- Name: tagentity_users__user_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE tagentity_users__user_tags DROP CONSTRAINT IF EXISTS tagentity_users__user_tags_pkey;
ALTER TABLE ONLY tagentity_users__user_tags
    ADD CONSTRAINT tagentity_users__user_tags_pkey PRIMARY KEY (id);


--
-- Name: task_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE task DROP CONSTRAINT IF EXISTS task_pkey;
ALTER TABLE ONLY task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- Name: userauth_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE userauth DROP CONSTRAINT IF EXISTS userauth_pkey;
ALTER TABLE ONLY userauth
    ADD CONSTRAINT userauth_pkey PRIMARY KEY (id);


--
-- Name: useremail_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE useremail DROP CONSTRAINT IF EXISTS useremail_pkey;
ALTER TABLE ONLY useremail
    ADD CONSTRAINT useremail_pkey PRIMARY KEY (id);


--
-- Name: usernotification_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE usernotification DROP CONSTRAINT IF EXISTS usernotification_pkey;
ALTER TABLE ONLY usernotification
    ADD CONSTRAINT usernotification_pkey PRIMARY KEY (id);


--
-- Name: userpassword_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE userpassword DROP CONSTRAINT IF EXISTS userpassword_pkey;
ALTER TABLE ONLY userpassword
    ADD CONSTRAINT userpassword_pkey PRIMARY KEY (id);


--
-- Name: userpasswordreset_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE userpasswordreset DROP CONSTRAINT IF EXISTS userpasswordreset_pkey;
ALTER TABLE ONLY userpasswordreset
    ADD CONSTRAINT userpasswordreset_pkey PRIMARY KEY (id);


--
-- Name: usersetting_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE usersetting DROP CONSTRAINT IF EXISTS usersetting_pkey;
ALTER TABLE ONLY usersetting
    ADD CONSTRAINT usersetting_pkey PRIMARY KEY (id);


--
-- Name: volunteer_pkey; Type: CONSTRAINT; Schema: public; Owner: midas; Tablespace:
--
ALTER TABLE volunteer DROP CONSTRAINT IF EXISTS volunteer_pkey;
ALTER TABLE ONLY volunteer
    ADD CONSTRAINT volunteer_pkey PRIMARY KEY (id);
