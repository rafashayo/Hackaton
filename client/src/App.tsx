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
  const [view, setView] = useState<'home' | 'login' | 'register' | 'profileForm' | 'profileResult' | 'teacherHome' | 'teacherStudents' | 'studentTeachers' | 'studentRequestTeacher' | 'teacherMaterials' | 'teacherMaterialForm' | 'studentMaterials' | 'studentMaterialDetail'>('home');
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      fetchProfile(storedToken);
    }
  }, []);

  async function fetchProfile(authToken: string) {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      
      if (user.role === 'docente') {
        setView('teacherHome');
        return;
      }
      
      const data = await api('/profile/me');
      setProfile(data.profile);
      setView(data.profile ? 'profileResult' : 'profileForm');
    } catch (err) {
      console.error(err);
      if (user?.role === 'docente') {
        setView('teacherHome');
      } else {
        setError('No se pudo cargar el perfil');
      }
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
      setView(data.user.role === 'alumno' ? 'profileForm' : 'teacherHome');
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
              <button className={`nav-item ${view !== 'profileForm' && view !== 'profileResult' && view !== 'studentTeachers' && view !== 'studentRequestTeacher' && view !== 'studentMaterials' && view !== 'studentMaterialDetail' ? 'active' : ''}`} onClick={() => setView('home')}>
                <HomeI /> <span>Inicio</span>
              </button>
              <button
                className={`nav-item ${view === 'profileForm' || view === 'profileResult' ? 'active' : ''}`}
                onClick={() => setView(profile ? 'profileResult' : 'profileForm')}
              >
                <UserI /> <span>Mi perfil</span>
              </button>
              <button
                className={`nav-item ${view === 'studentTeachers' || view === 'studentRequestTeacher' ? 'active' : ''}`}
                onClick={() => setView('studentTeachers')}
              >
                <GridI /> <span>Mis docentes</span>
              </button>
              <button
                className={`nav-item ${view === 'studentMaterials' || view === 'studentMaterialDetail' ? 'active' : ''}`}
                onClick={() => setView('studentMaterials')}
              >
                <GridI /> <span>📚 Materiales</span>
              </button>
            </>
          ) : (
            <>
              <button className={`nav-item ${view === 'teacherHome' ? 'active' : ''}`} onClick={() => setView('teacherHome')}>
                <HomeI /> <span>Inicio</span>
              </button>
              <button className={`nav-item ${view === 'teacherStudents' ? 'active' : ''}`} onClick={() => setView('teacherStudents')}>
                <PeopleI /> <span>Mis alumnos</span>
              </button>
              <button className={`nav-item ${view === 'teacherMaterials' || view === 'teacherMaterialForm' ? 'active' : ''}`} onClick={() => setView('teacherMaterials')}>
                <GridI /> <span>📚 Mis materiales</span>
              </button>
            </>
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

        {isAlumno && view === 'studentTeachers' && (
          <StudentTeachers user={user} onRequestTeacher={() => setView('studentRequestTeacher')} error={error} setError={setError} />
        )}

        {isAlumno && view === 'studentRequestTeacher' && (
          <StudentRequestTeacher user={user} onBack={() => setView('studentTeachers')} error={error} setError={setError} />
        )}

        {isAlumno && view === 'studentMaterials' && (
          <StudentMaterials user={user} onSelectMaterial={() => setView('studentMaterialDetail')} error={error} setError={setError} />
        )}

        {isAlumno && view === 'studentMaterialDetail' && (
          <StudentMaterialDetail user={user} onBack={() => setView('studentMaterials')} error={error} setError={setError} />
        )}

        {!isAlumno && view === 'teacherHome' && (
          <TeacherPanel user={user} onGoToStudents={() => setView('teacherStudents')} />
        )}

        {!isAlumno && view === 'teacherStudents' && (
          <TeacherStudents user={user} error={error} setError={setError} />
        )}

        {!isAlumno && view === 'teacherMaterials' && (
          <TeacherMaterials user={user} onCreateMaterial={() => setView('teacherMaterialForm')} error={error} setError={setError} />
        )}

        {!isAlumno && view === 'teacherMaterialForm' && (
          <TeacherMaterialForm user={user} onBack={() => setView('teacherMaterials')} onSaved={() => setView('teacherMaterials')} error={error} setError={setError} />
        )}
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
              <strong>Dimensiones más extremas:</strong> {profile.dimensionesDominantes?.join(', ') || '—'}
            </p>
            <p>
              <strong>Formato preferido:</strong> {profile.formato?.join(', ') || 'Sin selección'}
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
function TeacherPanel({ user, onGoToStudents }: { user: User; onGoToStudents?: () => void }) {
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
        {onGoToStudents && (
          <div className="btn-row">
            <button className="btn" onClick={onGoToStudents}>
              Ver solicitudes de alumnos
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ============================================================
   Mis docentes (alumno)
   ============================================================ */
function StudentTeachers({
  user,
  onRequestTeacher,
  error,
  setError,
}: {
  user: User;
  onRequestTeacher: () => void;
  error: string | null;
  setError: (e: string | null) => void;
}) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    try {
      setLoading(true);
      const data = await api('/student/teachers');
      setTeachers(data.teachers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar docentes');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>Mis docentes</h1>
          <div className="sub">Los docentes que te están guiando en tu aprendizaje.</div>
        </div>
        <button className="btn" onClick={onRequestTeacher}>
          + Agregar docente
        </button>
      </div>

      {loading && <div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>}

      {!loading && teachers.length === 0 && (
        <div className="card mt-22">
          <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
            Todavía no tenés docentes asignados. ¡Solicita a uno para empezar!
          </p>
        </div>
      )}

      {!loading && teachers.length > 0 && (
        <div className="card-grid mt-22">
          {teachers.map((st) => (
            <div key={st.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div className="avatar" style={{ width: 40, height: 40 }}>
                  {(st.teacher.name[0] || '?').toUpperCase()}
                </div>
                <div>
                  <div className="name">{st.teacher.name}</div>
                  <div className="role" style={{ fontSize: 12, color: '#999' }}>
                    {st.status === 'pending' ? '⏳ Pendiente' : st.status === 'active' ? '✓ Activo' : 'Completado'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                {st.teacher.email}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                Conectado desde {new Date(st.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ============================================================
   Solicitar docente (alumno)
   ============================================================ */
function StudentRequestTeacher({
  user,
  onBack,
  error,
  setError,
}: {
  user: User;
  onBack: () => void;
  error: string | null;
  setError: (e: string | null) => void;
}) {
  const [available, setAvailable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    try {
      setLoading(true);
      const data = await api('/student/available-teachers');
      setAvailable(data.teachers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar docentes');
    } finally {
      setLoading(false);
    }
  }

  async function requestTeacher(teacherId: number) {
    try {
      setLoading(true);
      await api('/student/request-teacher', {
        method: 'POST',
        body: JSON.stringify({ teacherId }),
      });
      setError(null);
      loadTeachers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>Agregar docente</h1>
          <div className="sub">Selecciona un docente para solicitar que te guíe.</div>
        </div>
        <button className="btn ghost" onClick={onBack}>
          ← Atrás
        </button>
      </div>

      {loading && <div style={{ padding: 20, textAlign: 'center' }}>Cargando docentes disponibles...</div>}

      {!loading && available.length === 0 && (
        <div className="card mt-22">
          <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
            No hay docentes disponibles en este momento.
          </p>
        </div>
      )}

      {!loading && available.length > 0 && (
        <div className="card-grid mt-22">
          {available.map((teacher) => (
            <div key={teacher.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div className="avatar" style={{ width: 40, height: 40 }}>
                  {(teacher.name[0] || '?').toUpperCase()}
                </div>
                <div>
                  <div className="name">{teacher.name}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                {teacher.email}
              </div>
              {teacher.course && (
                <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                  Curso: {teacher.course}
                </div>
              )}
              <button
                className="btn"
                style={{ width: '100%', marginTop: 12 }}
                onClick={() => requestTeacher(teacher.id)}
              >
                Solicitar
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ============================================================
   Mis alumnos (docente)
   ============================================================ */
function TeacherStudents({
  user,
  error,
  setError,
}: {
  user: User;
  error: string | null;
  setError: (e: string | null) => void;
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      setLoading(true);
      const data = await api('/teacher/students');
      setStudents(data.students);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: 'active' | 'rejected' | 'completed') {
    try {
      await api(`/teacher/students/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      loadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>Mis alumnos</h1>
          <div className="sub">Gestiona las solicitudes de tus estudiantes.</div>
        </div>
      </div>

      {loading && <div style={{ padding: 20, textAlign: 'center' }}>Cargando alumnos...</div>}

      {!loading && students.length === 0 && (
        <div className="card mt-22">
          <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
            No hay solicitudes de alumnos aún. Comparte tu código con ellos para que se vinculen.
          </p>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 22 }}>
          {students.map((st) => (
            <div key={st.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div className="avatar" style={{ width: 40, height: 40 }}>
                  {(st.student.name[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="name">{st.student.name}</div>
                  <div className="role" style={{ fontSize: 12, color: '#999' }}>
                    {st.student.course ? `${st.student.course}` : 'Sin curso'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                {st.student.email}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {st.status === 'pending' && (
                  <>
                    <button
                      className="btn"
                      style={{ flex: 1, fontSize: 12, padding: 8 }}
                      onClick={() => updateStatus(st.id, 'active')}
                    >
                      ✓ Aceptar
                    </button>
                    <button
                      className="btn ghost"
                      style={{ flex: 1, fontSize: 12, padding: 8 }}
                      onClick={() => updateStatus(st.id, 'rejected')}
                    >
                      ✗ Rechazar
                    </button>
                  </>
                )}
                {st.status !== 'pending' && (
                  <div style={{ fontSize: 12, color: '#999', padding: '8px 12px', width: '100%', textAlign: 'center' }}>
                    {st.status === 'active' ? '✓ Activo' : '✗ Rechazado'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ============================================================
   Mis materiales (docente)
   ============================================================ */
function TeacherMaterials({
  user,
  onCreateMaterial,
  error,
  setError,
}: {
  user: User;
  onCreateMaterial: () => void;
  error: string | null;
  setError: (e: string | null) => void;
}) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      setLoading(true);
      const data = await api('/material');
      setMaterials(data.materials || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar materiales');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>Mis materiales</h1>
          <div className="sub">Gestiona tus contenidos didácticos para los alumnos.</div>
        </div>
        <button className="btn" onClick={onCreateMaterial}>
          + Crear material
        </button>
      </div>

      {loading && <div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>}

      {!loading && materials.length === 0 && (
        <div className="card mt-22">
          <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
            Todavía no creaste materiales. ¡Crea uno para empezar!
          </p>
        </div>
      )}

      {!loading && materials.length > 0 && (
        <div className="card-grid mt-22">
          {materials.map((material) => (
            <div key={material.id} className="card material-card">
              <div className="material-card-header">
                <h3 className="material-card-title">{material.title}</h3>
                <span className="material-badge subject">{material.subject || 'Sin materia'}</span>
              </div>
              <div className="material-badges">
                <span className="material-badge level">{material.level}</span>
                <span className="material-badge">{new Date(material.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="material-preview">{material.content.substring(0, 180)}...</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ============================================================
   Crear material (docente)
   ============================================================ */
function TeacherMaterialForm({
  user,
  onBack,
  onSaved,
  error,
  setError,
}: {
  user: User;
  onBack: () => void;
  onSaved: () => void;
  error: string | null;
  setError: (e: string | null) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('Secundaria');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title || !content) {
      setError('Título y contenido son requeridos');
      return;
    }

    setSaving(true);
    try {
      await api('/material', {
        method: 'POST',
        body: JSON.stringify({ title, content, subject, level }),
      });
      setError(null);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>Crear material</h1>
          <div className="sub">Ingresa el contenido que los alumnos adaptarán según su estilo de aprendizaje.</div>
        </div>
        <button className="btn ghost" onClick={onBack}>
          ← Atrás
        </button>
      </div>

      <div className="card mt-22" style={{ maxWidth: 720 }}>
        <label className="field">
          <span>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="Ej: La fotosíntesis" />
        </label>

        <label className="field">
          <span>Materia (opcional)</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} type="text" placeholder="Ej: Biología" />
        </label>

        <label className="field">
          <span>Nivel</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option>Primaria</option>
            <option>Secundaria</option>
            <option>Universitario</option>
          </select>
        </label>

        <label className="field">
          <span>Contenido</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Pegá aquí el texto de tu material (puede ser de un PDF, libro, apunte, etc.)"
          />
        </label>

        {error && <div className="banner error" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="btn-row">
          <button className="btn" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar material'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Materiales disponibles (alumno)
   ============================================================ */
function StudentMaterials({
  user,
  onSelectMaterial,
  error,
  setError,
}: {
  user: User;
  onSelectMaterial: () => void;
  error: string | null;
  setError: (e: string | null) => void;
}) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      setLoading(true);
      const data = await api('/material');
      setMaterials(data.materials || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar materiales');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>Materiales de clase</h1>
          <div className="sub">Adaptá el contenido según tu estilo de aprendizaje.</div>
        </div>
      </div>

      {loading && <div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>}

      {!loading && materials.length === 0 && (
        <div className="card mt-22">
          <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>
            Todavía no hay materiales disponibles. Contactá a tu docente.
          </p>
        </div>
      )}

      {!loading && materials.length > 0 && (
        <div className="card-grid mt-22">
          {materials.map((material) => (
            <div
              key={material.id}
              className={`card material-card ${selectedId === material.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(material.id)}
            >
              <div className="material-card-header">
                <h3 className="material-card-title">{material.title}</h3>
                <div className="material-badges">
                  <span className="material-badge subject">{material.subject || 'Sin materia'}</span>
                  <span className="material-badge level">{material.level}</span>
                </div>
              </div>
              <p className="material-preview">{material.content.substring(0, 180)}...</p>
              <div className="btn-row" style={{ marginTop: 0 }}>
                <button
                  className="btn"
                  style={{ flex: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    localStorage.setItem('selectedMaterialId', String(material.id));
                    onSelectMaterial();
                  }}
                >
                  Ver y adaptar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ============================================================
   Detalle de material y generación adaptada (alumno)
   ============================================================ */
function StudentMaterialDetail({
  user,
  onBack,
  error,
  setError,
}: {
  user: User;
  onBack: () => void;
  error: string | null;
  setError: (e: string | null) => void;
}) {
  const materialId = parseInt(localStorage.getItem('selectedMaterialId') || '0');
  const [material, setMaterial] = useState<any | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'resumen' | 'explicacion' | 'ejercicios' | 'ejemplos' | 'esquema' | 'audio'>('resumen');
  const [adaptedContent, setAdaptedContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const formats = [
    { id: 'resumen', label: '📋 Resumen', desc: 'Puntos clave sintetizados' },
    { id: 'explicacion', label: '📖 Explicación', desc: 'Explicado de forma sencilla' },
    { id: 'ejercicios', label: '✏️ Ejercicios', desc: 'Preguntas y problemas' },
    { id: 'ejemplos', label: '🌍 Ejemplos', desc: 'Situaciones de la vida real' },
    { id: 'esquema', label: '🧠 Esquema', desc: 'Mapa conceptual' },
    { id: 'audio', label: '🎧 Audio', desc: 'Para escuchar' },
  ];

  useEffect(() => {
    loadMaterial();
  }, []);

  async function loadMaterial() {
    try {
      setLoading(true);
      const data = await api(`/material/${materialId}`);
      setMaterial(data.material);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar material');
    } finally {
      setLoading(false);
    }
  }

  async function generateAdapted() {
    if (!material) return;
    setGenerating(true);
    try {
      const data = await api(`/material/${materialId}/adapt`, {
        method: 'POST',
        body: JSON.stringify({ format: selectedFormat }),
      });
      setAdaptedContent(data.content);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar contenido');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;
  if (!material) return <div style={{ padding: 40, textAlign: 'center' }}>Material no encontrado</div>;

  return (
    <>
      <div className="page-head">
        <div className="head-fill">
          <h1>{material.title}</h1>
          <div className="sub">{material.subject} · {material.level}</div>
        </div>
        <button className="btn ghost" onClick={onBack}>
          ← Atrás
        </button>
      </div>

      <div className="material-detail-grid mt-22">
        <div className="card detail-card">
          <h2 className="card-title">Contenido original</h2>
          <div className="material-preview" style={{ maxHeight: 320, overflow: 'auto' }}>
            {material.content}
          </div>
        </div>

        <div className="card detail-card">
          <h2 className="card-title">Selecciona un formato</h2>
          <div className="format-grid mt-16">
            {formats.map((fmt) => (
              <button
                key={fmt.id}
                className={`format-btn ${selectedFormat === fmt.id ? 'selected' : ''}`}
                onClick={() => setSelectedFormat(fmt.id as any)}
                type="button"
              >
                <div style={{ fontWeight: 600 }}>{fmt.label}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{fmt.desc}</div>
              </button>
            ))}
          </div>

          <button
            className="btn"
            style={{ marginTop: 18, width: '100%' }}
            onClick={generateAdapted}
            disabled={generating}
          >
            {generating ? '⏳ Generando...' : '✨ Generar contenido adaptado'}
          </button>
        </div>
      </div>

      {adaptedContent && (
        <div className="card mt-22">
          <h2 className="card-title">✨ Contenido adaptado ({selectedFormat})</h2>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: '#333', whiteSpace: 'pre-wrap', padding: 16, background: '#f9f9f9', borderRadius: 4 }}>
            {adaptedContent}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
