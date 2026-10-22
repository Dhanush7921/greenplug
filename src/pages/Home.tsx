import { useRef } from 'react';
import { Connector } from '../components/Connector';
import { useReveals } from '../lib/reveal';
import { AppPreview } from '../sections/home/AppPreview';
import { DriverHost } from '../sections/home/DriverHost';
import { HeroStage } from '../sections/home/HeroStage';
import { ServicesArc } from '../sections/home/ServicesArc';
import { StoreCard } from '../sections/home/StoreCard';

export default function Home() {
  const ref = useRef<HTMLDivElement>(null);
  useReveals(ref);
  return (
    <div ref={ref} className="page-home">
      <HeroStage />
      <ServicesArc />
      <Connector />
      <DriverHost />
      <Connector />
      <AppPreview />
      <Connector />
      <StoreCard />
    </div>
  );
}
