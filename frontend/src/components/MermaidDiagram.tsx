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
        primaryColor: '#ffffff',
        primaryTextColor: '#000000',
        primaryBorderColor: '#333333',
        lineColor: '#333333',
        secondaryColor: '#ffffff',
        tertiaryColor: '#ffffff',
        background: '#ffffff',
        mainBkg: '#ffffff',
        secondBkg: '#ffffff',
        tertiaryTextColor: '#000000',
        textColor: '#000000',
        nodeTextColor: '#000000',
        edgeLabelBackground: '#ffffff',
        clusterBkg: '#ffffff',
        clusterTextColor: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontWeight: 'bold',
        // Force all text to be black
        cScale0: '#000000',
        cScale1: '#000000',
        cScale2: '#000000',
      },
    });

    const renderDiagram = async () => {
      if (ref.current) {
        try {
          const { svg } = await mermaid.render(`${id}-${Date.now()}`, chart);
          ref.current.innerHTML = svg;
          
          // Force all text to be black after rendering
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            const allText = svgElement.querySelectorAll('text, tspan, .nodeLabel, .edgeLabel');
            allText.forEach((textElement: any) => {
              textElement.style.fill = '#000000';
              textElement.style.color = '#000000';
              textElement.style.fontWeight = 'bold';
            });
          }
        } catch (error) {
          console.error('Error rendering mermaid diagram:', error);
          ref.current.innerHTML = '<p>Error rendering diagram</p>';
        }
      }
    };

    renderDiagram();
  }, [chart, id]);

  return (
    <div 
      ref={ref} 
      className="mermaid-container" 
      style={{
        background: 'white',
        color: 'black',
        '--mermaid-text-color': '#000000',
        '--mermaid-node-text-color': '#000000'
      } as any}
    />
  );
};