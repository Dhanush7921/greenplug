import { site } from '../config/site';
import { Icon } from './Icon';

/**
 * Store links read from VITE_PLAY_STORE_URL / VITE_APP_STORE_URL.
 * While a URL is empty the button switches to a clear "coming soon" state and opens early access instead.
 * When the apps launch, swap these for the official store badges per each store's brand guidelines.
 */
export function StoreButtons({ onComingSoon }: { onComingSoon?: () => void }) {
  const stores = [
    { key: 'play', url: site.stores.play, name: 'Google Play', icon: 'play' as const, live: 'Get it on' },
    { key: 'apple', url: site.stores.apple, name: 'App Store', icon: 'apple' as const, live: 'Download on the' },
  ];
  return (
    <div className="stores">
      {stores.map((s) =>
        s.url ? (
          <a key={s.key} className="store-btn" href={s.url} target="_blank" rel="noopener noreferrer" data-magnetic="0.3">
            <Icon name={s.icon} />
            <small>{s.live}</small>
            <strong>{s.name}</strong>
          </a>
        ) : (
          <button key={s.key} type="button" className="store-btn" onClick={onComingSoon} data-magnetic="0.3" aria-label={`${s.name}: coming soon. Join early access instead`} data-cursor="Notify me">
            <Icon name={s.icon} />
            <small>Coming soon to</small>
            <strong>{s.name}</strong>
          </button>
        ),
      )}
    </div>
  );
}
