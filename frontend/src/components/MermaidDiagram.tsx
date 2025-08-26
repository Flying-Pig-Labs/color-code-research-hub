import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '@/contexts/ThemeContext';

interface MermaidDiagramProps {
  chart: string;
  id?: string;
}

export const MermaidDiagram = ({ chart, id = 'mermaid-diagram' }: MermaidDiagramProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { actualTheme } = useTheme();

  useEffect(() => {
    const isDark = actualTheme === 'dark';
    
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: isDark ? '#1f2937' : '#ffffff',
        primaryTextColor: isDark ? '#ffffff' : '#000000',
        primaryBorderColor: isDark ? '#6b7280' : '#333333',
        lineColor: isDark ? '#9ca3af' : '#333333',
        secondaryColor: isDark ? '#374151' : '#ffffff',
        tertiaryColor: isDark ? '#374151' : '#ffffff',
        background: isDark ? '#111827' : '#ffffff',
        mainBkg: isDark ? '#1f2937' : '#ffffff',
        secondBkg: isDark ? '#374151' : '#ffffff',
        tertiaryTextColor: isDark ? '#ffffff' : '#000000',
        textColor: isDark ? '#ffffff' : '#000000',
        nodeTextColor: isDark ? '#ffffff' : '#000000',
        edgeLabelBackground: isDark ? '#1f2937' : '#ffffff',
        clusterBkg: isDark ? '#374151' : '#ffffff',
        clusterTextColor: isDark ? '#ffffff' : '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontWeight: 'bold',
        // Force text colors based on theme
        cScale0: isDark ? '#ffffff' : '#000000',
        cScale1: isDark ? '#ffffff' : '#000000',
        cScale2: isDark ? '#ffffff' : '#000000',
      },
    });

    const renderDiagram = async () => {
      if (ref.current) {
        try {
          const { svg } = await mermaid.render(`${id}-${Date.now()}`, chart);
          ref.current.innerHTML = svg;
          
          // Force text colors based on theme after rendering
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            const textColor = isDark ? '#ffffff' : '#000000';
            const allText = svgElement.querySelectorAll('text, tspan, .nodeLabel, .edgeLabel');
            allText.forEach((textElement: any) => {
              textElement.style.fill = textColor;
              textElement.style.color = textColor;
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
  }, [chart, id, actualTheme]);

  const isDark = actualTheme === 'dark';
  
  return (
    <div 
      ref={ref} 
      className="mermaid-container" 
      style={{
        background: isDark ? '#111827' : 'white',
        color: isDark ? 'white' : 'black',
        '--mermaid-text-color': isDark ? '#ffffff' : '#000000',
        '--mermaid-node-text-color': isDark ? '#ffffff' : '#000000'
      } as any}
    />
  );
};