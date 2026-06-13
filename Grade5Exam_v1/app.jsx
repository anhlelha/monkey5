/* =========================================================
   App router — Cùng Khỉ con vào lớp 6 CLC
   ========================================================= */
const { useState: useStateApp, useEffect: useEffectApp, Fragment: F } = React;

const App = () => {
  /* phase: signin → onboarding → app */
  const [phase, setPhase] = useStateApp("signin");
  const [route, setRoute] = useStateApp("home");
  const [routeParams, setRouteParams] = useStateApp({});
  const [user, setUser] = useStateApp({ ...USER, targets: [] });
  const [examAnswers, setExamAnswers] = useStateApp(null);

  const nav = (r, params = {}) => {
    setRoute(r);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  /* ===== Sign-in ===== */
  if (phase === "signin") {
    return <SignIn onSignIn={() => setPhase("onboarding")} />;
  }

  /* ===== Onboarding ===== */
  if (phase === "onboarding") {
    return (
      <Onboarding
        user={user}
        onComplete={({ targets, hours }) => {
          setUser(u => ({ ...u, targets, hours }));
          setPhase("app");
        }}
      />
    );
  }

  /* ===== Exam-taking (fullscreen) ===== */
  if (route === "exam") {
    return (
      <ExamTaking
        examId={routeParams.examId}
        onSubmit={(ans) => { setExamAnswers(ans); nav("results"); }}
        onExit={() => nav("home")}
      />
    );
  }

  /* ===== App shell ===== */
  return (
    <div className="app">
      <Sidebar route={route} onNav={(r) => nav(r)} user={user} />

      {route === "home"     && <Dashboard user={user} onUpdateUser={(patch) => { setUser(u => ({ ...u, ...patch })); Object.assign(window.USER, patch); }} onNav={nav} />}
      {route === "library"  && <Library initialSchool={routeParams.school} onNav={nav} />}
      {route === "create"   && <Create onNav={nav} />}
      {route === "create-ex" && <CreateExercise initialTopic={routeParams.topic} onNav={nav} />}
      {route === "topics"   && <Topics initialTopic={routeParams.topic} onNav={nav} />}
      {route === "results"  && (
        <Results examId={routeParams.examId} answers={examAnswers}
                 onNav={nav}
                 onRetry={() => { setExamAnswers(null); nav("exam", { examId: routeParams.examId }); }} />
      )}
      {route === "admin"    && <Admin />}
      {route === "profile"  && <Dashboard user={user} onNav={nav} /> /* fallback */}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
