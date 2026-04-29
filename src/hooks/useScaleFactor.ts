'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook que calcula o fator de escala necessário para caber um conteúdo
 * de dimensão fixa (baseWidth × baseHeight) dentro do container pai.
 *
 * Usa ResizeObserver com contentRect para medição precisa em todos os casos,
 * inclusive na inicialização em que getBoundingClientRect pode retornar 0.
 *
 * Retorna:
 *  - containerRef: ref para o elemento wrapper (o container responsivo)
 *  - scale: fator de escala a aplicar no conteúdo interno
 */
export function useScaleFactor(baseWidth: number, baseHeight: number) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const computeScale = useCallback(
        (width: number, height: number) => {
            if (width <= 0 || height <= 0) return;
            const scaleX = width / baseWidth;
            const scaleY = height / baseHeight;
            setScale(Math.min(scaleX, scaleY));
        },
        [baseWidth, baseHeight]
    );

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Mede depois do primeiro paint para garantir que o layout já aconteceu
        const rafId = requestAnimationFrame(() => {
            const { width, height } = el.getBoundingClientRect();
            computeScale(width, height);
        });

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                computeScale(width, height);
            }
        });
        observer.observe(el);

        return () => {
            cancelAnimationFrame(rafId);
            observer.disconnect();
        };
    }, [computeScale]);

    return { containerRef, scale };
}
