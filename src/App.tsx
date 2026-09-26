import { Switch, Route } from "wouter";
import ChatApp from "@/components/ChatApp";
import { AuthProvider } from "@/lib/auth";

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/faq" component={() => <ChatApp initialPage="faq" />} />
        <Route path="/privacy" component={() => <ChatApp initialPage="privacy" />} />
        <Route path="/about" component={() => <ChatApp initialPage="about" />} />
        <Route path="/settings" component={() => <ChatApp initialPage="settings" />} />
        <Route component={() => <ChatApp />} />
      </Switch>
    </AuthProvider>
  );
}

export default App;
