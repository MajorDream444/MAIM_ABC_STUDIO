import React from 'react';
import {Composition} from 'remotion';
import {PromoTest} from './PromoTest';
import {FilmF, F_DURATION} from './campaign/FilmF';
import {FilmA, A_DURATION} from './campaign/FilmA';
import {FilmB, B_DURATION} from './campaign/FilmB';
import {FilmC, C_DURATION} from './campaign/FilmC';
import {FilmD, D_DURATION} from './campaign/FilmD';
import {FilmE, E_DURATION} from './campaign/FilmE';
import {Storyboard} from './campaign/Storyboard';
const V = {fps: 30, width: 1080, height: 1920};
export const PromoRoot = () => <>
  <Composition id="PromoTest" component={PromoTest} durationInFrames={60} {...V}/>
  <Composition id="A-ThinkingPool" component={FilmA} durationInFrames={A_DURATION} {...V}/>
  <Composition id="B-Awareness" component={FilmB} durationInFrames={B_DURATION} {...V}/>
  <Composition id="C-Belief" component={FilmC} durationInFrames={C_DURATION} {...V}/>
  <Composition id="D-Context" component={FilmD} durationInFrames={D_DURATION} {...V}/>
  <Composition id="E-ThinkBuild" component={FilmE} durationInFrames={E_DURATION} {...V}/>
  <Composition id="F-Cohort" component={FilmF} durationInFrames={F_DURATION} {...V} defaultProps={{variant: 'dated' as const}}/>
  <Composition id="F-Cohort-Evergreen" component={FilmF} durationInFrames={F_DURATION} {...V} defaultProps={{variant: 'evergreen' as const}}/>
  <Composition id="Storyboard" component={Storyboard} durationInFrames={15} {...V}/>
</>;
