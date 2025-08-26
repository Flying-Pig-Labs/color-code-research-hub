import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  id?: string;
}

export const MermaidDiagram = ({ chart, id = 'mermaid-diagram' }: MermaidDiagramProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        background: '#ffffff',
        primaryColor: '#ffffff',
        primaryTextColor: '#000000',
        primaryBorderColor: '#333333',
        lineColor: '#333333',
        secondaryColor: '#ffffff',
        tertiaryColor: '#ffffff',
        edgeLabelBackground: '#ffffff',
        nodeTextColor: '#000000',
        mainBkg: '#ffffff',
        secondBkg: '#ffffff',
        tertiaryTextColor: '#000000',
      },
    });

    const renderDiagram = async () => {
      if (ref.current) {
        try {
          const { svg } = await mermaid.render(`${id}-${Date.now()}`, chart);
          ref.current.innerHTML = svg;
        } catch (error) {
          console.error('Error rendering mermaid diagram:', error);
          ref.current.innerHTML = '<p>Error rendering diagram</p>';
        }
      }
    };

    renderDiagram();
  }, [chart, id]);

  return <div ref={ref} className="mermaid-container" />;
};