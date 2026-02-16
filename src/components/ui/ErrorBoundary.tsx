'use client';

import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Une erreur inattendue est survenue.</div>;
    }
    return this.props.children;
  }
}
