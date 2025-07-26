import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateState } from '../redux/gameSlice';
import StoryIntroVideo from '../components/StoryIntroVideo';
import MapMainView from '../components/MapMainView';

function MapScreen() {
  const dispatch = useDispatch();
  const game = useSelector(state => state.game);
  const [isVideoPlaying, setIsVideoPlaying] = useState(!game.videoWatched);

  const handleIntroEnd = () => {
    dispatch(updateState({ videoWatched: true }));
    setIsVideoPlaying(false);
  };

  if (isVideoPlaying) {
    return (
      <StoryIntroVideo
        onEnd={handleIntroEnd}
        onSkip={handleIntroEnd}
      />
    );
  }

  return <MapMainView />;
}

export default MapScreen;
