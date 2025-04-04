import React from 'react';

// Ghibli Theme Colors
export const ghibliColors = {
  background: "#f8f5e6",
  card: "#f0e6c0",
  text: "#5a3e2b",
  border: "#b89d65",
  borderDark: "#8c7851",
  primary: "#b89d65",
  primaryHover: "#a08a55",
  accent: "#6b8e50",
  blue: "#4a90a0",
  cloud: "#d9e5f0"
}

export function GhibliButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="bg-ghibli-primary hover:bg-ghibli-primary-hover text-ghibli-card border-2 border-ghibli-border-dark rounded-lg px-4 py-2 transition-colors"
      {...props}
    >
      {children}
    </button>
  )
}

interface GhibliCardProps {
  title: string;
  children: React.ReactNode;
}

export function GhibliCard({ title, children }: GhibliCardProps) {
  return (
    <div className="bg-ghibli-card p-6 rounded-xl border-2 border-ghibli-border shadow-lg">
      <h3 className="text-xl font-serif tracking-wide text-ghibli-text mb-4">{title}</h3>
      <div className="text-ghibli-text/80">
        {children}
      </div>
    </div>
  )
} 