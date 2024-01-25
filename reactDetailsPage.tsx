import {Alert} from './Alert';
import {EAlertType} from './EAlertType';
import {Ellipsis} from './Ellipsis';
import {Page} from './Page';
import {AttachmentsList} from './AttachmentsList';
import {IFileState} from './Models';
import {FormDetails} from './FormDetails';
import {FormRightColumn} from '/FormRightColumn';
import {LightboxActionButtons} from './LightboxActionButtons';
import {RestError} from '/RestError';
import {useShallowEqualSelector} from './useShallowEqualSelector';
import commonStyle from './Styles.less';
import {TSkeletonConfig, useSkeleton} from './skeletonUtils';
import {i18n} from 'i18n/config';
import {DocumentLetters} from './DocumentLetters';
import React, {useEffect, useState} from 'react';
import {useAppDispatch} from 'Store/hooks';
import {EDocumentType, EStatus} from './Enums';
import {selectDetailsDocumentId, selectIsDetailsError, selectIsDetailsSkeleton, selectServiceDetailsData} from './detailsSelectors';
import {updateDetailsFile} from '../../Slices/detailsSlices';
import style from '../../Styles/DetailsPage.less';
import {getListActions, getServiceTypeByRequest, renderDocumentNumber} from '../../Utils';
import {useLightBoxSideOverlayContext} from '../LightBoxWithSideOverlayContext';
import {DetailsDownload} from './DetailsDownload';
import {Stepper} from './Stepper';
import {SideComponent} from './SideComponent';

/** Конфиг скелетона. */
const SKELETON_CONFIG: TSkeletonConfig = {
    actionButtons: {width: 184, height: 32, isComponent: true},
    itemLength: {width: 42},
    status: {width: 80, isComponent: true},
    writeOff: {width: 80},
    accountFieldDescription: {width: 150, height: 16},
    attachmentSize: {width: 60, height: 16},
    attachmentStatus: {width: 80, isComponent: true},
    attachmentActions: {width: 20, isComponent: true},
    SideComponentIcon: {width: 64, height: 64, isComponent: true, isCircle: true},
    SideComponentTitle: {height: 24, width: 300},
    SideComponentSubTitle: {width: 420},
    SideComponentSubAction: {width: 120, isComponent: true, height: 16},
    stepper: {width: 430, height: 32, isComponent: true},
};

/** Свойства компонента. */
interface IProps {
    /** Тип документа. */
    type: EDocumentType;
    /** Обработчик повторного запроса данных. */
    onRetry: () => void;
    /** Флаг открытия формы на ответ. */
    isAnswer?: boolean;
}

/** Компонент страницы с детальной формой. */
export const DetailsPage: React.FC<IProps> = ({type, onRetry, isAnswer}) => {
    const details = useShallowEqualSelector(selectServiceDetailsData);
    const isError = useShallowEqualSelector(selectIsDetailsError);
    const isShowSkeleton = useShallowEqualSelector(selectIsDetailsSkeleton);
    const serviceType = getServiceTypeByRequest(type);
    const {renderWithSkeleton} = useSkeleton(isShowSkeleton, SKELETON_CONFIG);
    const {sideOverlayNode, sideOverlayOpened} = useLightBoxSideOverlayContext();
    const [countLastUnansweredOverlayViews, setLastUnansweredOverlayViews] = useState(0);

    const dispatch = useAppDispatch();

    useEffect(() => {
        if (details.id) {
        }
    }, [details]);

    useEffect(() => {
        isAnswer && setLastUnansweredOverlayViews((number) => number + 1);
    }, [isAnswer]);

    /**
     * Обработчик обновления вложения.
     *
     * @param file Данные файла.
     */
    const handleUpdateFile = (file: Partial<IFileState>) => {
        dispatch(updateDetailsFile(file));
    };

    const handleOpenLettersSideOverlay = () => setLastUnansweredOverlayViews((number) => number + 1);

    /** Рендер правой колонки в деталке. */
    const renderRightContent = () =>
        !isShowSkeleton ? (
            <>
                {details.status === EStatus.DONE && <DetailsDownload />}
                {details.linkedDocument && details.linkedDocument.id && <detailsLinked linkedDocument={details.linkedDocument} />}
            </>
        ) : null;

    /** Рендер блока с информацией о документе. */
    const renderInfoAlert = () => {
        const textKey = `info.${serviceType}`;
        const isShowInfoAlert = details.status === EStatus.CREATED && i18n.exists(textKey);

        if (isShowInfoAlert) {
            return (
                <div className={commonStyle.pre}>
                    <Alert type={EAlertType.INFO}>{i18n.t(textKey)}</Alert>
                </div>
            );
        }

        return null;
    };

    /** Рендер заголовка лайтбокса. */
    const renderHeaderTitleText = () => {
        const title = i18n.t('title');

        return (
            <Ellipsis maxLine={1} title={title}>
                {title}
            </Ellipsis>
        );
    };

    return (
        <Page>
            <Page.Header sticky>
                <Page.Header.Title>
                    <Page.Header.Title.Content>
                        <Page.Header.Title.Content.Text>{renderHeaderTitleText()}</Page.Header.Title.Content.Text>
                        <Page.Header.Title.Content.Subhead>
                            <div className={style.detailsSubhead}>
                                {i18n.t(`type.${serviceType}`)}&nbsp;
                                {!isError && renderWithSkeleton(renderDocumentNumber(details), 'subTitle')}
                            </div>
                        </Page.Header.Title.Content.Subhead>
                    </Page.Header.Title.Content>
                    <Page.Header.Title.Controls data-test-id="lightbox-actions">
                        {!isError &&
                            renderWithSkeleton(<LightboxActionButtons actions={getListActions(details, dispatch)} />, 'actionButtons')}
                    </Page.Header.Title.Controls>
                </Page.Header.Title>
                {!isError && <Stepper id={details.id} onRenderValue={renderWithSkeleton} status={details.status} />}
            </Page.Header>
            <Page.Body>
                {!isError ? (
                    <>
                        <FormRightColumn renderContent={renderRightContent}>
                            {renderInfoAlert()}
                            <FormDetails onRenderValue={renderWithSkeleton} />
                            {details.attachments.length > 0 && (
                                <AttachmentsList
                                    attachments={details.attachments}
                                    onRenderValue={renderWithSkeleton}
                                    onSelectDocumentId={selectDetailsDocumentId}
                                    onUpdateFile={handleUpdateFile}
                                />
                            )}
                            <DocumentLetters
                                correspondenceSource="project"
                                docUuid={details.id}
                                sideOverlayOpened={sideOverlayOpened}
                                sideOverlayParentNode={sideOverlayNode}
                                viewLast={countLastUnansweredOverlayViews}
                            />
                        </FormRightColumn>
                    </>
                ) : (
                    <RestError onRetry={onRetry} />
                )}
            </Page.Body>
            {!isError && (
                <Page.Footer sticky>
                    <SideComponent
                        details={details}
                        onOpenLettersSideOverlay={handleOpenLettersSideOverlay}
                        onRenderValue={renderWithSkeleton}
                    />
                </Page.Footer>
            )}
        </Page>
    );
};
