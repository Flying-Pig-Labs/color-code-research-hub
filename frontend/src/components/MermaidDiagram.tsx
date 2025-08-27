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
        // Node/tile backgrounds: light gray for light mode, very dark for dark mode
        primaryColor: isDark ? '#0f1419' : '#f3f4f6',
        primaryTextColor: isDark ? '#ffffff' : '#000000',
        primaryBorderColor: isDark ? '#374151' : '#333333',
        lineColor: isDark ? '#6b7280' : '#333333',
        secondaryColor: isDark ? '#1f2937' : '#e5e7eb',
        tertiaryColor: isDark ? '#1f2937' : '#e5e7eb',
        background: isDark ? '#111827' : '#ffffff',
        mainBkg: isDark ? '#0f1419' : '#f3f4f6',
        secondBkg: isDark ? '#1f2937' : '#e5e7eb',
        tertiaryTextColor: isDark ? '#ffffff' : '#000000',
        textColor: isDark ? '#ffffff' : '#000000',
        nodeTextColor: isDark ? '#ffffff' : '#000000',
        edgeLabelBackground: isDark ? '#0f1419' : '#ffffff',
        clusterBkg: isDark ? '#1f2937' : '#e5e7eb',
        clusterTextColor: isDark ? '#ffffff' : '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontWeight: 'normal',
        // Force text colors based on theme
        cScale0: isDark ? '#ffffff' : '#000000',
        cScale1: isDark ? '#ffffff' : '#000000',
        cScale2: isDark ? '#ffffff' : '#000000',
      },
      flowchart: {
        nodeSpacing: 20,
        rankSpacing: 50,
        curve: 'basis',
        padding: 15,
      },
      themeCSS: `
        .node rect, .node circle, .node ellipse, .node polygon {
          fill: ${isDark ? '#0f1419' : '#f3f4f6'} !important;
          stroke: ${isDark ? '#374151' : '#333333'} !important;
        }
        .node text {
          fill: ${isDark ? '#ffffff' : '#000000'} !important;
          font-size: 12px !important;
          font-weight: normal !important;
        }
        .edgeLabel {
          background-color: ${isDark ? '#0f1419' : '#ffffff'} !important;
        }
        .cluster rect {
          fill: ${isDark ? '#1f2937' : '#e5e7eb'} !important;
          stroke: ${isDark ? '#374151' : '#333333'} !important;
        }
      `,
    });

    const renderDiagram = async () => {
      if (ref.current) {
        try {
          const { svg } = await mermaid.render(`${id}-${Date.now()}`, chart);
          ref.current.innerHTML = svg;
          
          // Force styling based on theme after rendering
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            const textColor = isDark ? '#ffffff' : '#000000';
            const nodeColor = isDark ? '#0f1419' : '#f3f4f6';
            const strokeColor = isDark ? '#374151' : '#333333';
            
            // Fix text styling and ensure it's not cut off
            const allText = svgElement.querySelectorAll('text, tspan, .nodeLabel, .edgeLabel');
            allText.forEach((textElement: any) => {
              textElement.style.fill = textColor;
              textElement.style.color = textColor;
              textElement.style.fontWeight = 'normal';
              textElement.style.fontSize = '12px';
              textElement.style.fontFamily = 'Arial, sans-serif';
              // Prevent text overflow
              textElement.style.overflow = 'visible';
              textElement.style.textOverflow = 'clip';
            });
            
            // Fix node backgrounds
            const allNodes = svgElement.querySelectorAll('.node rect, .node circle, .node ellipse, .node polygon');
            allNodes.forEach((node: any) => {
              node.style.fill = nodeColor;
              node.style.stroke = strokeColor;
              node.style.strokeWidth = '2px';
            });
            
            // Ensure SVG has proper viewBox and dimensions for text visibility
            svgElement.style.overflow = 'visible';
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
      className="mermaid-container w-full overflow-visible" 
      style={{
        background: isDark ? '#111827' : 'white',
        color: isDark ? 'white' : 'black',
        minHeight: '400px',
        padding: '20px',
        '--mermaid-text-color': isDark ? '#ffffff' : '#000000',
        '--mermaid-node-text-color': isDark ? '#ffffff' : '#000000'
      } as any}
    />
  );
};