import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import useEventCallback from './use-event-callback';

type CurrentHeaders = {
  [key: string]: Element;
};

/**
 * This hook defines the active section as the piece of content being read by the user.
 *
 * To determine the active section, we observe the position of the h3 or h2 in the viewport.
 * h2, and h3 need to be generated using Markdown syntax in the MDX files (##, and ###), so
 * Gatbsy's GraphQL can pick it up and build the Table of Contents.
 *
 * An Intersection Observer is responsible to watch the position of these
 * headers in the viewport:
 *   - Every time a header enters or leaves the viewport it fires an event.
 *   - the event header (h3 or h2) will tell us if visible or if entering or exiting,
 *     the viewport (isIntersecting with). If intersecting it is added to array of
 *     current headers in the viewport
 *   - On change to array check with header element is nearer the top of the viewport
 *     and set active.
 */
const useIntersectionTracker = (idsToTrack: string) => {
  const [activeSectionId, setActiveSectionId] = useState<string>();
  const [currentHeadersInViewport, setCurrentHeadersInViewport] = useState<
    CurrentHeaders
  >({});
  const { asPath } = useRouter();

  // TODO: work out why the intersection observer is not working when isolated (having to allow a circular re-render
  // to get it to work in this configuration). Have tried polyfill to no success.
  const onHeadingEntersViewport = useEventCallback(
    (observedEntries: IntersectionObserverEntry[]) => {
      if (!observedEntries || !observedEntries.length) return;
      observedEntries.forEach((entry) => {
        const { isIntersecting } = entry;
        const entryId = entry.target.id;
        // add to current headers is intersecting with the viewport
        if (isIntersecting) {
          // use states version of previous so concurrent mode & async friendly
          setCurrentHeadersInViewport((prevState) => {
            // check previous intersection events that may not being removed by a fast scroll
            // event and remove if above the viewport.
            const filteredPrevState = Object.keys(prevState)
              .filter(
                (elementId) =>
                  prevState[elementId].getBoundingClientRect().height > 0,
              )
              .reduce<CurrentHeaders>(
                (accumulator, currentValue) => ({
                  ...accumulator,
                  [currentValue]: prevState[currentValue],
                }),
                {},
              );
            return {
              ...filteredPrevState,
              [entryId]: entry.target,
            };
          });
        }
        // remove from current headers if no longer insterecting with viewport.
        if (
          !isIntersecting &&
          typeof currentHeadersInViewport[entryId] !== 'undefined'
        ) {
          setCurrentHeadersInViewport((prevState) => {
            const clonedObject = { ...prevState };
            delete clonedObject[entryId];
            return clonedObject;
          });
        }
      });
    },
  );

  /**
   * On updated of current headers in viewport iterate through, work out which one
   * is higher up and set as active.
   */
  useEffect(() => {
    const intersectingHeaders = Object.keys(currentHeadersInViewport);
    if (intersectingHeaders.length) {
      const highestIntersectingHeader = intersectingHeaders
        .sort(
          (a, b) =>
            currentHeadersInViewport[a].getBoundingClientRect().y -
            currentHeadersInViewport[b].getBoundingClientRect().y,
        )
        .filter(Boolean);
      setActiveSectionId(highestIntersectingHeader[0]);
    }
  }, [currentHeadersInViewport]);

  /**
   * Instantiate intersection observer
   */
  useEffect(() => {
    const observer = new IntersectionObserver(onHeadingEntersViewport, {
      threshold: 1,
    });

    // need to work out why but intersection observer isn't working if setting targets immedaitely.
    // temp solution. Possibly lazy image loading effecting the dom?
    setTimeout(() => {
      const targets = document.querySelectorAll(idsToTrack);
      targets.forEach((target) => observer.observe(target));
    }, 200);

    // on dismount of parent disconnect the observer
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [idsToTrack, onHeadingEntersViewport, asPath]);

  return {
    activeSectionId,
  };
};

export default useIntersectionTracker;
