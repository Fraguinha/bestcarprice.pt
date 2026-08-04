import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Algo correu mal</h1>
            <p className="text-muted-foreground">Ocorreu um erro inesperado.</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }} className="text-primary hover:underline">Voltar à página inicial</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
