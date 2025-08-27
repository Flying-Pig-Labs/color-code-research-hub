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
      theme: 'default',
      themeVariables: {
        // Use white background with black text for maximum contrast
        primaryColor: '#ffffff',
        primaryTextColor: '#000000',
        primaryBorderColor: '#333333',
        lineColor: '#333333',
        secondaryColor: '#f8f9fa',
        tertiaryColor: '#e9ecef',
        background: '#ffffff',
        mainBkg: '#ffffff',
        secondBkg: '#f8f9fa',
        tertiaryTextColor: '#000000',
        textColor: '#000000',
        nodeTextColor: '#000000',
        edgeLabelBackground: '#ffffff',
        clusterBkg: '#f8f9fa',
        clusterTextColor: '#000000',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontWeight: 'bold',
        // Force all text to be black
        cScale0: '#000000',
        cScale1: '#000000',
        cScale2: '#000000',
        cScale3: '#000000',
        cScale4: '#000000',
        cScale5: '#000000',
        cScale6: '#000000',
        cScale7: '#000000',
      },
      flowchart: {
        nodeSpacing: 20,
        rankSpacing: 50,
        curve: 'basis',
        padding: 15,
      },
      themeCSS: `
        .node rect, .node circle, .node ellipse, .node polygon {
          fill: #ffffff !important;
          stroke: #333333 !important;
          stroke-width: 2px !important;
        }
        .node text, .nodeLabel, .edgeLabel, .cluster text, text, tspan {
          fill: #000000 !important;
          color: #000000 !important;
          font-size: 14px !important;
          font-weight: bold !important;
          font-family: Arial, sans-serif !important;
        }
        .edgeLabel {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        .cluster rect {
          fill: #f8f9fa !important;
          stroke: #333333 !important;
          stroke-width: 1px !important;
        }
        .edgePath .path {
          stroke: #333333 !important;
          stroke-width: 2px !important;
        }
        .marker {
          fill: #333333 !important;
          stroke: #333333 !important;
        }
      `,
    });

    const renderDiagram = async () => {
      if (ref.current) {
        try {
          const { svg } = await mermaid.render(`${id}-${Date.now()}`, chart);
          ref.current.innerHTML = svg;
          
          // Force black text and white backgrounds after rendering
          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            // Fix text styling - force black text with bold weight
            const allText = svgElement.querySelectorAll('text, tspan, .nodeLabel, .edgeLabel, foreignObject div');
            allText.forEach((textElement: any) => {
              textElement.style.fill = '#000000';
              textElement.style.color = '#000000';
              textElement.style.fontWeight = 'bold';
              textElement.style.fontSize = '14px';
              textElement.style.fontFamily = 'Arial, sans-serif';
              textElement.style.overflow = 'visible';
              textElement.style.textOverflow = 'clip';
            });
            
            // Fix node backgrounds - white with dark borders
            const allNodes = svgElement.querySelectorAll('.node rect, .node circle, .node ellipse, .node polygon');
            allNodes.forEach((node: any) => {
              node.style.fill = '#ffffff';
              node.style.stroke = '#333333';
              node.style.strokeWidth = '2px';
            });
            
            // Fix cluster backgrounds
            const allClusters = svgElement.querySelectorAll('.cluster rect');
            allClusters.forEach((cluster: any) => {
              cluster.style.fill = '#f8f9fa';
              cluster.style.stroke = '#333333';
              cluster.style.strokeWidth = '1px';
            });
            
            // Fix edge paths and arrows
            const allPaths = svgElement.querySelectorAll('.edgePath .path');
            allPaths.forEach((path: any) => {
              path.style.stroke = '#333333';
              path.style.strokeWidth = '2px';
            });
            
            const allMarkers = svgElement.querySelectorAll('.marker');
            allMarkers.forEach((marker: any) => {
              marker.style.fill = '#333333';
              marker.style.stroke = '#333333';
            });
            
            // Ensure SVG has proper viewBox and dimensions for text visibility
            svgElement.style.overflow = 'visible';
            svgElement.style.backgroundColor = '#ffffff';
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
        background: 'white',
        color: 'black',
        minHeight: '400px',
        padding: '20px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      } as any}
    />
  );
};