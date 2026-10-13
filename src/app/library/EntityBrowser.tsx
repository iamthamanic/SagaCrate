/**
 * EntityBrowser — shared browse shell for Library entity tabs (Charaktere, Welten, Sagas).
 * Uses shared center-focus Embla kit (cover-flow, loop via slide expansion, center glow).
 * Location: src/app/library/EntityBrowser.tsx
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { Button } from '../../shared/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '../../shared/ui/carousel';
import {
  CENTER_FOCUS_LIBRARY_SLIDE_BASIS_CLASS,
  expandSlidesForEmblaLoop,
  useCenterFocusCarousel,
} from '../../shared/carousel';
import { cn } from '../../shared/ui/utils';

export type EntityBrowserViewMode = 'carousel' | 'list';

export type EntityBrowserRenderContext = {
  variant: EntityBrowserViewMode;
  isCenter: boolean;
  /** Carousel: side card click scrolls to center, center card click activates. List: activates. */
  onActivate: () => void;
};

type EntityBrowserProps<T extends { id: string }> = {
  storageKey: string;
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T, context: EntityBrowserRenderContext) => ReactNode;
  onOpenItem?: (item: T) => void;
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
  emptyState?: ReactNode;
};

const VIEW_MODES: readonly EntityBrowserViewMode[] = ['carousel', 'list'];

function isViewMode(value: unknown): value is EntityBrowserViewMode {
  return typeof value === 'string' && (VIEW_MODES as readonly string[]).includes(value);
}

function loadInitialViewMode(storageKey: string): EntityBrowserViewMode {
  const fallback: EntityBrowserViewMode = window.innerWidth >= 768 ? 'list' : 'carousel';
  try {
    const saved = window.localStorage.getItem(storageKey);
    return isViewMode(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

function CarouselViewModeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4" aria-hidden="true">
      <rect x="1" y="4" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.6" />
      <rect x="6" y="2" width="4" height="12" rx="0.5" fill="currentColor" />
      <rect x="12" y="4" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function EntityBrowser<T extends { id: string }>({
  storageKey,
  items,
  getId,
  renderItem,
  onOpenItem,
  toolbarLeft,
  toolbarRight,
  emptyState,
}: EntityBrowserProps<T>) {
  const [viewMode, setViewMode] = useState<EntityBrowserViewMode>(() => loadInitialViewMode(storageKey));

  // Embla turns loop off when slides don't fill the viewport — duplicate until scrollable.
  const loopPackRef = useRef(expandSlidesForEmblaLoop(items));
  const prevItemsKeyRef = useRef('');
  const itemsKey = items.map(getId).join('|');
  if (prevItemsKeyRef.current !== itemsKey) {
    prevItemsKeyRef.current = itemsKey;
    loopPackRef.current = expandSlidesForEmblaLoop(items);
  }
  const loopPack = loopPackRef.current;
  const slides = loopPack.slides;

  const {
    setApi,
    current,
    scrollPrev,
    scrollNext,
    scrollToIndex,
    handleCardClick,
    carouselCss,
    emblaOpts,
    dotsClass,
    dotClass,
    navClass,
    navButtonClass,
    getItemClassName,
    getCardClassName,
    contentClassName,
  } = useCenterFocusCarousel({
    itemCount: slides.length,
    enabled: viewMode === 'carousel',
    prefix: 'entity-browser',
    visualMode: 'coverflow',
    slideBasisClassName: CENTER_FOCUS_LIBRARY_SLIDE_BASIS_CLASS,
  });

  const sourceCurrent = loopPack.toSourceIndex(current);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, viewMode);
    } catch {
      // Private mode / storage disabled.
    }
  }, [storageKey, viewMode]);

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const scrollToSource = (sourceIndex: number) => {
    scrollToIndex(loopPack.nearestSlideIndex(sourceIndex, current));
  };

  const activateItem = (item: T, slideIndex: number) => {
    if (viewMode === 'list') {
      onOpenItem?.(item);
      return;
    }
    handleCardClick(slideIndex, () => onOpenItem?.(item));
  };

  return (
    <div className="@container w-full min-w-0 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 text-sm text-muted-foreground">{toolbarLeft}</div>
        <div className="flex items-center gap-2">
          {toolbarRight}
          <div className="flex items-center gap-1 rounded-lg border p-1" role="group" aria-label="Ansicht wählen">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Karussell-Ansicht"
              aria-pressed={viewMode === 'carousel'}
              onClick={() => setViewMode('carousel')}
              className={cn('h-8 w-8 p-0', viewMode === 'carousel' && 'bg-background shadow-sm')}
            >
              <CarouselViewModeIcon />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Listenansicht"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={cn('h-8 w-8 p-0', viewMode === 'list' && 'bg-background shadow-sm')}
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'carousel' ? (
        <div className="relative px-0 py-5 pb-14">
          <style>{carouselCss}</style>

          <Carousel setApi={setApi} opts={emblaOpts} className="w-full">
            <CarouselContent className={cn(contentClassName, 'items-start')}>
              {slides.map((item, slideIndex) => {
                const sourceIndex = loopPack.toSourceIndex(slideIndex);
                return (
                  <CarouselItem
                    key={`${getId(item)}__${slideIndex}`}
                    className={getItemClassName(slideIndex)}
                  >
                    <div
                      className={getCardClassName()}
                      onClick={() => handleCardClick(slideIndex, () => onOpenItem?.(item))}
                    >
                      {renderItem(item, {
                        variant: 'carousel',
                        isCenter: sourceIndex === sourceCurrent && slideIndex === current,
                        onActivate: () => activateItem(item, slideIndex),
                      })}
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>

          {items.length > 1 && (
            <div className={navClass}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  navButtonClass,
                  'left-1 top-[42%] h-10 w-10 -translate-y-1/2 rounded-full border-2 bg-background/95 shadow-xl backdrop-blur-sm transition-transform hover:scale-110 md:left-4 md:h-12 md:w-12',
                )}
                aria-label="Vorheriges Element"
                onClick={scrollPrev}
              >
                <ChevronLeft className="size-5 md:size-6" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  navButtonClass,
                  'right-1 top-[42%] h-10 w-10 -translate-y-1/2 rounded-full border-2 bg-background/95 shadow-xl backdrop-blur-sm transition-transform hover:scale-110 md:right-4 md:h-12 md:w-12',
                )}
                aria-label="Nächstes Element"
                onClick={scrollNext}
              >
                <ChevronRight className="size-5 md:size-6" />
              </Button>
            </div>
          )}

          {items.length > 1 && (
            <div className={dotsClass}>
              {items.map((item, sourceIndex) => (
                <button
                  key={getId(item)}
                  type="button"
                  aria-label={`Zu Element ${sourceIndex + 1} springen`}
                  className={cn(dotClass, sourceIndex === sourceCurrent && 'active')}
                  onClick={() => scrollToSource(sourceIndex)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={getId(item)}>
              {renderItem(item, {
                variant: 'list',
                isCenter: false,
                onActivate: () => activateItem(item, 0),
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
