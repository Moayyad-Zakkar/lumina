import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  FeatherArrowLeft,
  FeatherPlay,
  FeatherPause,
  FeatherSkipBack,
  FeatherSkipForward,
  FeatherChevronsLeft,
  FeatherChevronsRight,
} from '@subframe/core';
import supabase from '../../helper/supabaseClient';
import { capitalizeFirst } from '../../helper/formatText';

// Import view icons
import AlignerFrontIcon from '../../assets/imgs/views/aligner-front.svg';
import AlignerFrontActiveIcon from '../../assets/imgs/views/aligner-front-active.svg';
import AlignerLeftIcon from '../../assets/imgs/views/aligner-left.svg';
import AlignerLeftActiveIcon from '../../assets/imgs/views/aligner-left-active.svg';
import AlignerRightIcon from '../../assets/imgs/views/aligner-right.svg';
import AlignerRightActiveIcon from '../../assets/imgs/views/aligner-right-active.svg';
import AlignerUpperIcon from '../../assets/imgs/views/aligner-upper.svg';
import AlignerUpperActiveIcon from '../../assets/imgs/views/aligner-upper-active.svg';
import AlignerLowerIcon from '../../assets/imgs/views/aligner-lower.svg';
import AlignerLowerActiveIcon from '../../assets/imgs/views/aligner-lower-active.svg';
import maxilla from '../../assets/imgs/views/aligner-info-upper.svg';
import mandible from '../../assets/imgs/views/aligner-info-lower.svg';

import ViewButton from '../components/viewer/ViewButton';
import { Loader } from '../components/Loader';
import JawView from '../components/viewer/JawView';

function CaseViewer() {
  const { t, i18n } = useTranslation();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { caseId } = useParams();

  const [view, setView] = useState('Front');
  const [currentTab, setCurrentTab] = useState('videos');

  // Slideshow state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const slideShowInterval = useRef(null);

  // Check if current language is Arabic
  const isRTL = i18n.language === 'ar';

  const fetchCaseData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch case data
      const { data: caseInfo, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError) throw caseError;

      // Fetch all treatment plan images
      const { data: images, error: imagesError } = await supabase
        .from('treatment_plan_images')
        .select('*')
        .eq('case_id', caseId)
        .order('sequence_order', { ascending: true });

      if (imagesError) throw imagesError;

      // Get public URLs for all images
      const imagesWithUrls = await Promise.all(
        (images || []).map(async (img) => {
          const { data } = supabase.storage
            .from('treatment-plans')
            .getPublicUrl(img.storage_path);

          return {
            ...img,
            url: data.publicUrl,
          };
        })
      );

      // Organize sequence images
      const sequenceByView = {
        front: [],
        left: [],
        right: [],
        upper: [],
        lower: [],
      };

      imagesWithUrls
        .filter((img) => img.image_category === 'sequence')
        .forEach((img) => {
          if (sequenceByView[img.view_type]) {
            sequenceByView[img.view_type].push(img);
          }
        });

      // Organize before/after images
      const beforeAfter = {
        front: null,
        left: null,
        right: null,
        upper: null,
        lower: null,
      };

      imagesWithUrls
        .filter((img) => img.image_category === 'beforeAfter')
        .forEach((img) => {
          if (beforeAfter[img.view_type] !== undefined) {
            beforeAfter[img.view_type] = img.url;
          }
        });

      // Store full sequence data
      const organizedData = {
        ...caseInfo,
        sequenceImages: sequenceByView,
        beforeAfter,
      };

      setCaseData(organizedData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCaseData();
  }, [fetchCaseData]);

  // Auto-play slideshow
  useEffect(() => {
    if (isPlaying && currentTab === 'videos') {
      const viewKey = view.toLowerCase();
      const images = caseData?.sequenceImages?.[viewKey] || [];

      if (images.length > 0) {
        slideShowInterval.current = setInterval(() => {
          setCurrentImageIndex((prevIndex) => {
            if (prevIndex >= images.length - 1) {
              setIsPlaying(false);
              return images.length - 1;
            }
            return prevIndex + 1;
          });
        }, 500);
      }
    } else {
      if (slideShowInterval.current) {
        clearInterval(slideShowInterval.current);
      }
    }

    return () => {
      if (slideShowInterval.current) {
        clearInterval(slideShowInterval.current);
      }
    };
  }, [isPlaying, currentTab, view, caseData]);

  // Reset to first image when changing views
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsPlaying(false);
    setImagesLoaded(false);
    setLoadingProgress(0);
  }, [view, currentTab]);

  // Preload all images for current view
  useEffect(() => {
    if (currentTab === 'videos' && caseData) {
      const viewKey = view.toLowerCase();
      const images = caseData?.sequenceImages?.[viewKey] || [];

      if (images.length === 0) {
        setImagesLoaded(true);
        return;
      }

      setImagesLoaded(false);
      setLoadingProgress(0);

      let loadedCount = 0;
      const imagePromises = images.map((img, index) => {
        return new Promise((resolve) => {
          const image = new Image();
          image.onload = () => {
            loadedCount++;
            setLoadingProgress(Math.round((loadedCount / images.length) * 100));
            resolve();
          };
          image.onerror = () => {
            console.error(`Failed to preload image ${index + 1}:`, img.url);
            loadedCount++;
            setLoadingProgress(Math.round((loadedCount / images.length) * 100));
            resolve();
          };
          image.src = img.url;
        });
      });

      Promise.all(imagePromises).then(() => {
        setImagesLoaded(true);
        console.log(`All ${images.length} images preloaded for ${view} view`);
      });
    }
  }, [view, currentTab, caseData]);

  if (loading) {
    return (
      <Content>
        <LoadingSpinner className="flex flex-col items-center">
          <Loader size="large" />
          {t('viewer.loadingViewer')}
        </LoadingSpinner>
      </Content>
    );
  }

  if (error) {
    return (
      <Content>
        <ErrorMessage>
          {t('common.error')}: {error}
        </ErrorMessage>
      </Content>
    );
  }

  if (!caseData) {
    return (
      <Content>
        <ErrorMessage>{t('viewer.caseNotFound')}</ErrorMessage>
      </Content>
    );
  }

  // Tab change function
  const tabChanger = (tab) => {
    setCurrentTab(tab);
  };

  // View change function
  const viewChanger = (viewName) => {
    setView(viewName);
  };

  // Check which sequence views have content
  const sequenceViewAvailability = {
    lower: !!(caseData.sequenceImages?.lower?.length > 0),
    upper: !!(caseData.sequenceImages?.upper?.length > 0),
    right: !!(caseData.sequenceImages?.right?.length > 0),
    left: !!(caseData.sequenceImages?.left?.length > 0),
    front: !!(caseData.sequenceImages?.front?.length > 0),
  };

  // Check which before after views have content
  const beforeAfterViewAvailability = {
    lower: !!caseData.beforeAfter.lower,
    upper: !!caseData.beforeAfter.upper,
    right: !!caseData.beforeAfter.right,
    left: !!caseData.beforeAfter.left,
    front: !!caseData.beforeAfter.front,
  };

  // Get current images for the selected view
  const viewKey = view.toLowerCase();
  const sequenceImages = caseData.sequenceImages?.[viewKey] || [];
  const imgSrc = caseData.beforeAfter[viewKey];

  // Slideshow control functions
  const togglePlay = () => {
    if (sequenceImages.length === 0 || !imagesLoaded) return;
    setIsPlaying(!isPlaying);
  };

  const seekToStart = () => {
    setIsPlaying(false);
    setCurrentImageIndex(0);
  };

  const seekToEnd = () => {
    setIsPlaying(false);
    setCurrentImageIndex(Math.max(0, sequenceImages.length - 1));
  };

  const seekOneStepForward = () => {
    setIsPlaying(false);
    setCurrentImageIndex((prev) =>
      Math.min(prev + 1, sequenceImages.length - 1)
    );
  };

  const seekOneStepBackward = () => {
    setIsPlaying(false);
    setCurrentImageIndex((prev) => Math.max(prev - 1, 0));
  };

  /* Patient Name */
  const firstName = capitalizeFirst(caseData?.first_name);
  const lastName = capitalizeFirst(caseData?.last_name);
  const patientName = `${firstName} ${lastName}`;

  return (
    <Content>
      {/* Header with Logo */}
      <Header>
        <LogoContainer>
          <LogoImage src="/logo.png" alt="Lumina Logo" />
          {/*<LogoText>{t('viewer.title')}</LogoText>*/}
        </LogoContainer>
      </Header>

      <Container>
        {/* Patient Information */}
        <PatientInfo>
          <InfoItem>
            <Label>{t('viewer.patientName')}:</Label>
            <Value>{patientName || '—'}</Value>
          </InfoItem>
          <InfoItem>
            <Label>{t('viewer.caseNumber')}:</Label>
            <Value>#{caseData.id || '—'}</Value>
          </InfoItem>
        </PatientInfo>

        {/* Tabs */}
        <TabsContainer>
          <Tab
            active={currentTab === 'videos'}
            onClick={() => tabChanger('videos')}
          >
            {t('viewer.sequenceAnimation')}
          </Tab>
          <Tab
            active={currentTab === 'before-after'}
            onClick={() => tabChanger('before-after')}
          >
            {t('viewer.beforeAfter')}
          </Tab>
        </TabsContainer>

        {/* Views Selection */}
        {currentTab === 'videos' ? (
          <ViewsContainer>
            {sequenceViewAvailability.front && (
              <ViewButton
                isActive={view === 'Front'}
                activeIcon={AlignerFrontActiveIcon}
                disabledIcon={AlignerFrontIcon}
                name="Front"
                viewChanger={viewChanger}
              />
            )}
            {sequenceViewAvailability.left && (
              <ViewButton
                isActive={view === 'Left'}
                activeIcon={AlignerLeftActiveIcon}
                disabledIcon={AlignerLeftIcon}
                name="Left"
                viewChanger={viewChanger}
              />
            )}
            {sequenceViewAvailability.right && (
              <ViewButton
                isActive={view === 'Right'}
                activeIcon={AlignerRightActiveIcon}
                disabledIcon={AlignerRightIcon}
                name="Right"
                viewChanger={viewChanger}
              />
            )}
            {sequenceViewAvailability.upper && (
              <ViewButton
                isActive={view === 'Upper'}
                activeIcon={AlignerUpperActiveIcon}
                disabledIcon={AlignerUpperIcon}
                name="Upper"
                viewChanger={viewChanger}
              />
            )}
            {sequenceViewAvailability.lower && (
              <ViewButton
                isActive={view === 'Lower'}
                activeIcon={AlignerLowerActiveIcon}
                disabledIcon={AlignerLowerIcon}
                name="Lower"
                viewChanger={viewChanger}
              />
            )}
          </ViewsContainer>
        ) : (
          <ViewsContainer>
            {beforeAfterViewAvailability.front && (
              <ViewButton
                isActive={view === 'Front'}
                activeIcon={AlignerFrontActiveIcon}
                disabledIcon={AlignerFrontIcon}
                name="Front"
                viewChanger={viewChanger}
              />
            )}
            {beforeAfterViewAvailability.left && (
              <ViewButton
                isActive={view === 'Left'}
                activeIcon={AlignerLeftActiveIcon}
                disabledIcon={AlignerLeftIcon}
                name="Left"
                viewChanger={viewChanger}
              />
            )}
            {beforeAfterViewAvailability.right && (
              <ViewButton
                isActive={view === 'Right'}
                activeIcon={AlignerRightActiveIcon}
                disabledIcon={AlignerRightIcon}
                name="Right"
                viewChanger={viewChanger}
              />
            )}
            {beforeAfterViewAvailability.upper && (
              <ViewButton
                isActive={view === 'Upper'}
                activeIcon={AlignerUpperActiveIcon}
                disabledIcon={AlignerUpperIcon}
                name="Upper"
                viewChanger={viewChanger}
              />
            )}
            {beforeAfterViewAvailability.lower && (
              <ViewButton
                isActive={view === 'Lower'}
                activeIcon={AlignerLowerActiveIcon}
                disabledIcon={AlignerLowerIcon}
                name="Lower"
                viewChanger={viewChanger}
              />
            )}
          </ViewsContainer>
        )}

        {/* Media Display */}
        {currentTab === 'videos' ? (
          <>
            <DataContainer>
              {sequenceImages.length > 0 ? (
                <>
                  {!imagesLoaded && (
                    <LoadingOverlay>
                      <LoadingSpinnerSmall>
                        {t('viewer.preloadingImages')} {loadingProgress}%
                      </LoadingSpinnerSmall>
                      <LoadingBar>
                        <LoadingBarFill
                          style={{ width: `${loadingProgress}%` }}
                        />
                      </LoadingBar>
                    </LoadingOverlay>
                  )}
                  <ImageStack>
                    {sequenceImages.map((img, index) => (
                      <DataImage
                        key={img.id}
                        src={img.url}
                        alt={`${view} view - step ${index + 1}`}
                        style={{
                          display:
                            index === currentImageIndex ? 'block' : 'none',
                          opacity: imagesLoaded ? 1 : 0.3,
                        }}
                        onError={() => {
                          console.error('Image failed to load:', img.url);
                        }}
                      />
                    ))}
                  </ImageStack>
                  <ProgressOverlay>
                    <ProgressBar>
                      <ProgressFill
                        style={{
                          width: `${
                            ((currentImageIndex + 1) / sequenceImages.length) *
                            100
                          }%`,
                        }}
                      />
                    </ProgressBar>
                    <ProgressText>
                      {t('viewer.step')} {currentImageIndex + 1}{' '}
                      {t('viewer.of')} {sequenceImages.length}
                    </ProgressText>
                  </ProgressOverlay>
                </>
              ) : (
                <NoMediaMessage>{t('viewer.noSequenceImages')}</NoMediaMessage>
              )}
            </DataContainer>

            {sequenceImages.length > 0 && (
              <PlayerButtonsContainer>
                <ControlButton
                  onClick={seekToStart}
                  title={t('viewer.jumpToStart')}
                  disabled={!imagesLoaded}
                >
                  <FeatherChevronsLeft />
                </ControlButton>
                <ControlButton
                  onClick={seekOneStepBackward}
                  title={t('viewer.previousStep')}
                  disabled={!imagesLoaded}
                >
                  <FeatherSkipBack />
                </ControlButton>
                <PlayButton onClick={togglePlay} disabled={!imagesLoaded}>
                  {isPlaying ? <FeatherPause /> : <FeatherPlay />}
                </PlayButton>
                <ControlButton
                  onClick={seekOneStepForward}
                  title={t('viewer.nextStep')}
                  disabled={!imagesLoaded}
                >
                  <FeatherSkipForward />
                </ControlButton>
                <ControlButton
                  onClick={seekToEnd}
                  title={t('viewer.jumpToEnd')}
                  disabled={!imagesLoaded}
                >
                  <FeatherChevronsRight />
                </ControlButton>
              </PlayerButtonsContainer>
            )}
          </>
        ) : (
          <DataContainer>
            {imgSrc ? (
              <DataImage
                src={imgSrc}
                alt={`${view} view before/after comparison`}
              />
            ) : (
              <NoMediaMessage>{t('viewer.noBeforeAfterImage')}</NoMediaMessage>
            )}
          </DataContainer>
        )}

        {/* Aligners Info */}
        <AlignersInfo>
          <AlignerBox>
            <JawView
              upperCount={caseData.upper_jaw_aligners || 0}
              jawImg={maxilla}
              name={t('viewer.upperAligners')}
            />
          </AlignerBox>
          <AlignerBox>
            <JawView
              upperCount={caseData.lower_jaw_aligners || 0}
              jawImg={mandible}
              name={t('viewer.lowerAligners')}
            />
          </AlignerBox>
        </AlignersInfo>

        {/* Disclaimer Section */}
        <DisclaimerContainer>
          <DisclaimerTitle>{t('viewer.disclaimer.title')}</DisclaimerTitle>
          <DisclaimerText isRTL={isRTL}>
            {t('viewer.disclaimer.points', { returnObjects: true }).map(
              (point, index) => (
                <li key={index}>{point}.</li>
              )
            )}
          </DisclaimerText>
        </DisclaimerContainer>
      </Container>
    </Content>
  );
}

// Styled Components (unchanged)
const Content = styled.div`
  text-align: center;
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #212529;
`;

const Header = styled.div`
  width: 100%;
  background-color: #fff;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoImage = styled.img`
  height: 50px;
  width: auto;
  object-fit: contain;

  @media (max-width: 768px) {
    height: 40px;
  }
`;

const LogoText = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: #00adef;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const BackButton = styled.button`
  position: absolute;
  left: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  color: #495057;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f8f9fa;
    border-color: #adb5bd;
  }

  @media (max-width: 768px) {
    position: static;
    margin-bottom: 1rem;
  }
`;

const Container = styled.div`
  width: 90%;
  max-width: 1200px;
  margin: 2rem auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    width: 95%;
    margin: 1rem auto;
  }
`;

const PatientInfo = styled.div`
  width: 100%;
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  gap: 3rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Label = styled.span`
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
`;

const Value = styled.span`
  font-size: 1rem;
  color: #212529;
  font-weight: 600;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  background-color: #fff;
  padding: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Tab = styled.button`
  padding: 0.75rem 2rem;
  background-color: ${(props) => (props.active ? '#0284c7' : 'transparent')};
  color: ${(props) => (props.active ? '#fff' : '#495057')};
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.active ? '#00adef' : '#f8f9fa')};
  }
`;

const ViewsContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const DataContainer = styled.div`
  height: 500px;
  width: 100%;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;

  @media (max-width: 768px) {
    height: 300px;
  }
`;

const ImageStack = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DataImage = styled.img`
  position: absolute;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  transition: opacity 0.3s ease;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  z-index: 10;
`;

const LoadingSpinnerSmall = styled.div`
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
`;

const LoadingBar = styled.div`
  width: 200px;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
`;

const LoadingBarFill = styled.div`
  height: 100%;
  background-color: #0284c7;
  transition: width 0.3s ease;
`;

const ProgressOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  direction: ltr;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #0284c7;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
`;

const NoMediaMessage = styled.div`
  color: #fff;
  font-size: 1.1rem;
  padding: 2rem;
`;

const PlayerButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  direction: ltr;
`;

const ControlButton = styled.button`
  padding: 0.75rem;
  background-color: #fff;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background-color: #f8f9fa;
    border-color: #0284c7;
    color: #0284c7;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PlayButton = styled.button`
  padding: 1rem 1.5rem;
  background-color: #0284c7;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background-color: #00adef;
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AlignersInfo = styled.div`
  display: flex;
  gap: 2rem;
  width: 100%;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const AlignerBox = styled.div`
  background-color: #fff;
  padding: 1.5rem 3rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 200px;
`;

const DisclaimerContainer = styled.div`
  width: 100%;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 1.5rem 2rem;
  margin-top: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const DisclaimerTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #856404;
  margin-bottom: 0.75rem;
  text-align: center;
`;

const DisclaimerText = styled.ul`
  font-size: 0.9rem;
  color: #856404;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  list-style-type: none; /* We will add custom bullets */
  text-align: ${(props) => (props.isRTL ? 'right' : 'left')};
  direction: ${(props) => (props.isRTL ? 'rtl' : 'ltr')};

  li {
    margin-bottom: 0.5rem;
    position: relative;
    padding-inline-start: 1.5rem;

    &:before {
      content: '•';
      position: absolute;
      left: ${(props) => (props.isRTL ? 'auto' : '0')};
      right: ${(props) => (props.isRTL ? '0' : 'auto')};
      font-weight: bold;
    }
  }
`;

const DisclaimerDivider = styled.div`
  height: 1px;
  background-color: #ffc107;
  margin: 1rem 0;
  opacity: 0.5;
`;

const LoadingSpinner = styled.div`
  font-size: 1.2rem;
  color: #6c757d;
  padding: 4rem;
`;

const ErrorMessage = styled.div`
  font-size: 1.1rem;
  color: #dc3545;
  padding: 2rem;
`;

export default CaseViewer;
