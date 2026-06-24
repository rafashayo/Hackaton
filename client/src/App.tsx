import { useEffect, useMemo, useState } from 'react';
import Icon from './brand/Icon';

type User = {
  id: number;
  name: string;
  email: string;
  role: 'alumno' | 'docente';
  course?: string;
};

type Profile = {
  dims: Record<string, number>;
  arquetipo: string;
  arquetipoDescripcion: string;
  arquetipoSecundario?: string;
  dimensionesDominantes: string[];
  formato: string[];
  trabajo: string;
  intereses?: string;
};

const questions = [
  { key: 'q1', label: 'Cuando un tema me interesa, lo investigo más aunque no entre en el examen.' },
  { key: 'q2', label: 'Estudio sobre todo para aprobar y zafar.' },
  { key: 'q3', label: 'Necesito ver para qué sirve algo en la vida real para engancharme.' },
  { key: 'q4', label: 'Cuando algo me sale mal, pienso que puedo mejorar si practico más.' },
  { key: 'q5', label: 'Evito las tareas difíciles porque prefiero no equivocarme.' },
  { key: 'q6', label: 'Suelo organizar mi tiempo de estudio con anticipación.' },
  { key: 'q7', label: 'Me cuesta arrancar y dejo todo para último momento.' },
  { key: 'q8', label: 'Necesito que me marquen pasos claros para no perderme.' },
  { key: 'q9', label: 'Aprendo mejor cuando puedo discutir las ideas con otros.' },
  { key: 'q10', label: 'Me pongo muy nervioso/a antes de un examen importante.' },
  { key: 'q11', label: 'Soy capaz de aprender casi cualquier cosa si me lo propongo.' },
];

const formats = ['Video', 'Texto/apunte', 'Ejercicios', 'Ejemplos reales', 'Esquemas', 'Audio'];
const workModes = ['Solo/a', 'En grupo', 'Depende'];

function getApiBase() {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
}

/* ---------- iconos en línea (estilo Discere) ---------- */
const Flame = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="#FF5E00">
    <path d="M12 2c2 3 1 5 0 6.2 1.1.2 2.2-.8 2.4-2.7 2.1 1.9 3.6 4.3 3.6 7.5a6 6 0 1 1-12 0c0-2.1 1-3.6 2.2-4.7-.1 1.4.6 2.4 1.6 2.6C12.4 8.5 11.4 5.4 12 2z" />
  </svg>
);
const Star = ({ s = 19 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="#00A6ED">
    <path d="M12 2l2.9 6.1 6.6.7-5 4.5 1.4 6.5L12 17.1 6.1 20.3l1.4-6.5-5-4.5 6.6-.7z" />
  </svg>
);
const HomeI = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M3 11l9-7 9 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 9.5V20h14V9.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const UserI = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2.2" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);
const GridI = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2.1" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2.1" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2.1" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2.1" />
  </svg>
);
const PeopleI = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="2.1" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.8M17 13.5a5.5 5.5 0 0 1 3.5 5.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
  </svg>
);
const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flex: 'none' }}>
    <path d="M9 6l6 6-6 6" stroke="#c8bfa6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function App() {
  const [view, setView] = useState<'home' | 'login' | 'register' | 'profileForm' | 'profileResult'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useMemo(() => localStorage.getItem('authToken'), []);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
      fetchProfile(storedToken);
    }
  }, []);

  async function api(path: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${getApiBase()}${path}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Error de servidor');
    }
    return data;
  }

  async function fetchProfile(authToken: string) {
    setLoading(true);
    try {
      const data = await api('/profile/me');
      setProfile(data.profile);
      setView(data.profile ? 'profileResult' : 'profileForm');
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      await fetchProfile(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(
    name: string,
    email: string,
    password: string,
    role: 'alumno' | 'docente',
    course: string,
  ) {
    setError(null);
    setLoading(true);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, course }),
      });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setView(data.user.role === 'alumno' ? 'profileForm' : 'home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
    setError(null);
    setView('home');
  }

  /* ---------- sin sesión: bienvenida / auth ---------- */
  if (!user) {
    if (view === 'login') {
      return <AuthForm mode="login" loading={loading} error={error} onSubmit={handleLogin} onBack={() => { setError(null); setView('home'); }} />;
    }
    if (view === 'register') {
      return <AuthForm mode="register" loading={loading} error={error} onSubmit={handleRegister} onBack={() => { setError(null); setView('home'); }} />;
    }
    return <Welcome onLogin={() => setView('login')} onRegister={() => setView('register')} />;
  }

  /* ---------- con sesión: shell con sidebar ---------- */
  const isAlumno = user.role === 'alumno';

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Icon name="Group4" size={26} />
          </div>
          <span className="brand-name">Discere</span>
        </div>
        {!isAlumno && <div className="sidebar-label">DOCENTE</div>}
        <nav className="nav">
          {isAlumno ? (
            <>
              <button className={`nav-item ${view !== 'profileForm' && view !== 'profileResult' ? 'active' : ''}`} onClick={() => setView('home')}>
                <HomeI /> <span>Inicio</span>
              </button>
              <button
                className={`nav-item ${view === 'profileForm' || view === 'profileResult' ? 'active' : ''}`}
                onClick={() => setView(profile ? 'profileResult' : 'profileForm')}
              >
                <UserI /> <span>Mi perfil</span>
              </button>
            </>
          ) : (
            <button className="nav-item active">
              <GridI /> <span>Panel</span>
            </button>
          )}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-user">
          <div className="avatar">{initials(user.name)}</div>
          <div>
            <div className="name">{user.name}</div>
            <div className="role">{isAlumno ? 'Estudiante' : 'Docente'}</div>
          </div>
        </div>
        <button className="btn ghost block" style={{ marginTop: 12 }} onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <main className="content">
        {loading && (
          <div className="banner" style={{ marginBottom: 16 }}>
            <span className="spin" style={{ marginRight: 8 }}>⌛</span> Cargando…
          </div>
        )}
        {error && (
          <div className="banner error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {isAlumno && view !== 'profileForm' && view !== 'profileResult' && (
          <StudentHome user={user} profile={profile} onOpenProfile={() => setView(profile ? 'profileResult' : 'profileForm')} />
        )}

        {isAlumno && view === 'profileForm' && (
          <ProfileForm
            onSaved={(p) => {
              setProfile(p);
              setView('profileResult');
            }}
          />
        )}

        {isAlumno && view === 'profileResult' && profile && (
          <ProfileResult profile={profile} onEdit={() => setView('profileForm')} />
        )}

        {!isAlumno && <TeacherPanel user={user} />}
      </main>
    </div>
  );
}

/* ============================================================
   Bienvenida
   ============================================================ */
function Welcome({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <Icon name="Group4" size={26} />
          </div>
          <span className="brand-name">Discere</span>
        </div>
        <h1>Aprendé a tu manera.</h1>
        <p className="lead">
          Una senda gamificada que se adapta a cómo aprendés. Tu perfil es una foto del momento, no una etiqueta fija.
        </p>
        <div className="row" style={{ marginBottom: 22, gap: 12 }}>
          <div className="stat-pill">
            <Flame /> Racha diaria
          </div>
          <div className="stat-pill">
            <Star /> XP &amp; insignias
          </div>
        </div>
        <div className="btn-row">
          <button className="btn block" onClick={onRegister}>
            Crear cuenta
          </button>
          <button className="btn ghost block" onClick={onLogin}>
            Ya tengo cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Login / Registro
   ============================================================ */
function AuthForm({
  mode,
  loading,
  error,
  onSubmit,
  onBack,
}: {
  mode: 'login' | 'register';
  loading: boolean;
  error: string | null;
  onSubmit: any;
  onBack: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'alumno' | 'docente'>('alumno');
  const [course, setCourse] = useState('');

  function submit() {
    if (mode === 'login') onSubmit(email, password);
    else onSubmit(name, email, password, role, course);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <Icon name="Group4" size={26} />
          </div>
          <span className="brand-name">Discere</span>
        </div>
        <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
        <p className="lead">
          {mode === 'login' ? 'Volvé a tu senda y mantené tu racha.' : 'Registrate como alumno o docente para empezar.'}
        </p>

        <label className="field">
          <span>Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="vos@correo.com" />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
        </label>

        {mode === 'register' && (
          <>
            <label className="field">
              <span>Nombre</span>
              <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Tu nombre" />
            </label>
            <label className="field">
              <span>Soy</span>
              <select value={role} onChange={(e) => setRole(e.target.value as 'alumno' | 'docente')}>
                <option value="alumno">Alumno/a</option>
                <option value="docente">Docente</option>
              </select>
            </label>
            {role === 'alumno' && (
              <label className="field">
                <span>Curso / división</span>
                <input value={course} onChange={(e) => setCourse(e.target.value)} type="text" placeholder="3°B" />
              </label>
            )}
          </>
        )}

        {error && <div className="banner error" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="btn-row">
          <button className="btn block" onClick={submit} disabled={loading}>
            {loading ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
          <button className="btn ghost block" onClick={onBack} type="button">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Inicio del alumno
   ============================================================ */
function StudentHome({
  user,
  profile,
  onOpenProfile,
}: {
  user: User;
  profile: Profile | null;
  onOpenProfile: () => void;
}) {
  const firstName = user.name.split(' ')[0];
  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>¡Hola, {firstName}!</h1>
          <div className="sub">Esto es lo que tenés para hoy.</div>
        </div>
        <div className="stat-pill">
          <Flame /> 7
        </div>
        <div className="stat-pill">
          <Star /> 1 240
        </div>
      </div>

      <div className="row mt-22" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 22 }}>
        {/* perfil de aprendizaje */}
        <div className="card" style={{ flex: '1 1 320px', minWidth: 280 }}>
          <h2 className="card-title">Tu perfil de aprendizaje</h2>
          {profile ? (
            <>
              <p className="card-sub">Foto del momento, no etiqueta fija.</p>
              <div className="row mt-16" style={{ alignItems: 'center', gap: 10 }}>
                <span className="tag blue">{profile.arquetipo}</span>
                {profile.arquetipoSecundario && <span className="tag orange">2º · {profile.arquetipoSecundario}</span>}
              </div>
              <p className="mt-16" style={{ fontWeight: 600, color: '#5a5346', lineHeight: 1.5, fontSize: 14 }}>
                {profile.arquetipoDescripcion}
              </p>
              <div className="btn-row">
                <button className="btn blue" onClick={onOpenProfile}>
                  Ver perfil completo
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="card-sub">Todavía no completaste tu cuestionario inicial.</p>
              <p className="mt-16" style={{ fontWeight: 600, color: '#5a5346', lineHeight: 1.5, fontSize: 14 }}>
                Respondé una sola vez para que la plataforma calibre tu senda según cómo aprendés.
              </p>
              <div className="btn-row">
                <button className="btn" onClick={onOpenProfile}>
                  Empezar cuestionario
                </button>
              </div>
            </>
          )}
        </div>

        {/* compañero IA */}
        <div className="ai-banner" style={{ flex: '1 1 320px', minWidth: 280 }}>
          <div className="head">
            <div className="ai-orb spin">
              <Icon name="Group4" size={28} />
            </div>
            <h3>Tu compañero IA</h3>
          </div>
          <p>
            Cuando completes tu perfil, voy a <b>calibrar tu senda</b> y avisarte qué reforzar antes de cada desafío.
            Aprendé a tu ritmo: yo me adapto a vos.
          </p>
        </div>
      </div>

      {/* tareas */}
      <div className="card mt-22">
        <h2 className="card-title">Próximos pasos</h2>
        <div className="list mt-16">
          <div className="list-row">
            <div className="ico" style={{ background: profile ? '#00A6ED' : '#FF5E00' }}>
              <Icon name={profile ? 'Librito' : 'Group13'} size={24} color="#fff" />
            </div>
            <div className="grow">
              <div className="t1">{profile ? 'Revisá tus dimensiones' : 'Completá tu perfil de aprendizaje'}</div>
              <div className="t2">{profile ? 'Perfil · listo' : 'Cuestionario · 11 preguntas'}</div>
            </div>
            <Chevron />
          </div>
          <div className="list-row">
            <div className="ico" style={{ background: '#3FB97A' }}>
              <Icon name="Vector" size={22} color="#fff" />
            </div>
            <div className="grow">
              <div className="t1">Mantené tu racha</div>
              <div className="t2">7 días seguidos · +XP cada día</div>
            </div>
            <Chevron />
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Cuestionario de perfil
   ============================================================ */
function ProfileForm({ onSaved }: { onSaved: (profile: Profile) => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>(
    questions.reduce((acc, item) => ({ ...acc, [item.key]: 3 }), {}),
  );
  const [formato, setFormato] = useState<string[]>([]);
  const [trabajo, setTrabajo] = useState('Solo/a');
  const [intereses, setIntereses] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No autorizado');
      const response = await fetch(`${getApiBase()}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers, formato, trabajo, intereses }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Error al guardar el perfil');
      onSaved(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>Perfil de aprendizaje</h1>
          <div className="sub">Contestá una sola vez. Tus respuestas marcan tu perfil del momento.</div>
        </div>
      </div>

      <div className="card mt-22" style={{ maxWidth: 720 }}>
        <div className="field-label">¿Qué tan de acuerdo estás? (1 = nada · 5 = mucho)</div>
        {questions.map((question) => (
          <div className="question" key={question.key}>
            <label>{question.label}</label>
            <div className="scale-row">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={answers[question.key] === value ? 'selected' : ''}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.key]: value }))}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="question">
          <label>Formato preferido</label>
          <div className="tags-row">
            {formats.map((option) => (
              <button
                key={option}
                type="button"
                className={formato.includes(option) ? 'selected' : ''}
                onClick={() =>
                  setFormato((prev) =>
                    prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
                  )
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="question">
          <label>Forma de trabajo</label>
          <div className="tags-row">
            {workModes.map((option) => (
              <button
                key={option}
                type="button"
                className={trabajo === option ? 'selected' : ''}
                onClick={() => setTrabajo(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>Intereses (opcional)</span>
          <textarea value={intereses} onChange={(e) => setIntereses(e.target.value)} rows={3} placeholder="Música, fútbol, programación…" />
        </label>

        {error && <div className="banner error" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="btn-row">
          <button className="btn" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar perfil'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Resultado del perfil
   ============================================================ */
function ProfileResult({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>Tu perfil actual</h1>
          <div className="sub">Es una foto del momento; se ajusta con feedback real más adelante.</div>
        </div>
      </div>

      <div className="row mt-22" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 22 }}>
        <div className="card" style={{ flex: '1 1 360px', minWidth: 300 }}>
          <h2 className="card-title">Resumen</h2>
          <div className="summary-box mt-16">
            <p>
              <strong>Arquetipo:</strong> {profile.arquetipo}
            </p>
            <p>{profile.arquetipoDescripcion}</p>
            {profile.arquetipoSecundario && (
              <p>
                <strong>Segundo posible arquetipo:</strong> {profile.arquetipoSecundario}
              </p>
            )}
            <p>
              <strong>Dimensiones más extremas:</strong> {profile.dimensionesDominantes.join(', ')}
            </p>
            <p>
              <strong>Formato preferido:</strong> {profile.formato.join(', ') || 'Sin selección'}
            </p>
            <p>
              <strong>Forma de trabajo:</strong> {profile.trabajo}
            </p>
            <p>
              <strong>Intereses:</strong> {profile.intereses || 'No definidos'}
            </p>
          </div>
          <div className="btn-row">
            <button className="btn blue" onClick={onEdit}>
              Actualizar perfil
            </button>
          </div>
        </div>

        <div className="card" style={{ flex: '1 1 360px', minWidth: 300 }}>
          <h2 className="card-title">Tus dimensiones</h2>
          <p className="card-sub">Escala de 1 a 5 según tus respuestas.</p>
          <div className="bars mt-16">
            {Object.entries(profile.dims).map(([key, value]) => (
              <div className="bar-row" key={key}>
                <span>{key}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${((value - 1) / 4) * 100}%` }} />
                </div>
                <span>{value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Panel docente
   ============================================================ */
function TeacherPanel({ user }: { user: User }) {
  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>Panel docente</h1>
          <div className="sub">Hola, {user.name}. Acá vas a seguir el progreso de tu clase.</div>
        </div>
      </div>

      <div className="ai-banner mt-22">
        <div className="head">
          <div className="ai-orb">
            <Icon name="Group4" size={22} />
          </div>
          <h3>La IA resume cómo viene tu clase</h3>
        </div>
        <p>
          A medida que tus alumnos completen su perfil de aprendizaje y resuelvan actividades, vas a ver acá quiénes
          necesitan ayuda y en qué se traban. Por ahora, la plataforma guarda los perfiles de aprendizaje de cada alumno.
        </p>
      </div>

      <div className="kpis mt-22">
        <div className="kpi">
          <div className="label">Alumnos activos</div>
          <div className="value" style={{ color: 'var(--ink)' }}>
            —<small>/30</small>
          </div>
        </div>
        <div className="kpi">
          <div className="label">Progreso promedio</div>
          <div className="value" style={{ color: 'var(--blue)' }}>
            —%
          </div>
        </div>
        <div className="kpi">
          <div className="label">Necesitan ayuda</div>
          <div className="value" style={{ color: 'var(--red)' }}>
            —
          </div>
        </div>
        <div className="kpi">
          <div className="label">Racha de la clase</div>
          <div className="value" style={{ color: 'var(--orange)' }}>
            —
          </div>
        </div>
      </div>

      <div className="card mt-22">
        <h2 className="card-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <PeopleI s={20} /> Mis alumnos
          </span>
        </h2>
        <p className="card-sub">Todavía no hay datos de progreso para mostrar.</p>
        <p className="mt-16" style={{ fontWeight: 600, color: '#5a5346', lineHeight: 1.5, fontSize: 14 }}>
          Compartí el curso con tus alumnos para que completen su perfil. Cuando lo hagan, vas a ver el semáforo de
          estado y las alertas de la IA en esta pantalla.
        </p>
      </div>
    </>
  );
}

export default App;
