import { ReactNode, useEffect, useState } from "react";

import Icon from "bvaughn-architecture-demo/components/Icon";
import {
  SourceCodeCommentTypeData,
  createTypeDataForSourceCodeComment,
} from "bvaughn-architecture-demo/components/sources/utils/comments";
import { isSourceCodeCommentTypeData } from "bvaughn-architecture-demo/components/sources/utils/comments";
import { CommentSourceLocation } from "bvaughn-architecture-demo/src/graphql/types";
import {
  ParsedToken,
  parsedTokensToHtml,
} from "bvaughn-architecture-demo/src/suspense/SyntaxParsingCache";
import { getSourceFileNameFromUrl } from "bvaughn-architecture-demo/src/utils/source";
import { selectLocation } from "devtools/client/debugger/src/actions/sources";
import { getThreadContext } from "devtools/client/debugger/src/selectors";
import { replayClient } from "shared/client/ReplayClientContext";
import { setViewMode } from "ui/actions/layout";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { Comment } from "ui/state/comments";
import { trackEvent } from "ui/utils/telemetry";

import LoadingLabelPlaceholder from "./LoadingLabelPlaceholder";
import styles from "./styles.module.css";

// Adapter component that can handle rendering legacy or modern source-code comments.
export default function SourceCodePreview({ comment }: { comment: Comment }) {
  const { type, typeData } = comment;

  if (isSourceCodeCommentTypeData(type, typeData)) {
    // Modern comments store all of the information needed to render the comment preview in the typeData field.
    return (
      <ModernSourceCodePreview
        columnIndex={typeData.columnIndex}
        lineNumber={typeData.lineNumber}
        parsedTokens={typeData.parsedTokens}
        rawText={typeData.rawText}
        sourceId={typeData.sourceId}
        sourceUrl={typeData.sourceUrl}
      />
    );
  } else if (comment.sourceLocation !== null) {
    // Legacy comments store only the source location (which requires loading source and lazily parsing).
    return <LegacySourceCodePreview sourceLocation={comment.sourceLocation || null} />;
  } else {
    return null;
  }
}

function LegacySourceCodePreview({
  sourceLocation,
}: {
  sourceLocation: CommentSourceLocation | null;
}) {
  // If the comment was created before the "typeData" attribute was added, lazily generate it using the source location.
  const [{ initialized, typeData }, setState] = useState<{
    initialized: boolean;
    typeData: SourceCodeCommentTypeData | null;
  }>({
    initialized: false,
    typeData: null,
  });

  useEffect(() => {
    if (initialized) {
      return;
    } else if (sourceLocation === null) {
      return;
    }

    const loadLabels = async () => {
      try {
        const typeData = await createTypeDataForSourceCodeComment(
          replayClient,
          sourceLocation.sourceId,
          sourceLocation.line,
          sourceLocation.column
        );

        setState({
          initialized: true,
          typeData,
        });
      } catch (error) {
        console.error(error);

        setState({
          initialized: true,
          typeData: null,
        });
      }
    };

    loadLabels();
  }, [sourceLocation, initialized]);

  if (!initialized) {
    return <LoadingLabelPlaceholder />;
  } else if (typeData !== null) {
    return (
      <ModernSourceCodePreview
        columnIndex={typeData.columnIndex}
        lineNumber={typeData.lineNumber}
        parsedTokens={typeData.parsedTokens}
        rawText={typeData.rawText}
        sourceId={typeData.sourceId}
        sourceUrl={typeData.sourceUrl}
      />
    );
  } else {
    return null;
  }
}

function ModernSourceCodePreview({
  columnIndex,
  lineNumber,
  parsedTokens,
  rawText,
  sourceId,
  sourceUrl,
}: {
  columnIndex: number;
  lineNumber: number;
  parsedTokens: ParsedToken[] | null;
  rawText: string | null;
  sourceId: string;
  sourceUrl: string | null;
}) {
  const context = useAppSelector(getThreadContext);
  const dispatch = useAppDispatch();

  const onSelectSource = () => {
    dispatch(setViewMode("dev"));

    trackEvent("comments.select_location");

    dispatch(
      selectLocation(context, {
        column: columnIndex,
        line: lineNumber,
        sourceId,
        sourceUrl: sourceUrl || undefined,
      })
    );
  };

  let location: ReactNode | null = null;
  if (sourceUrl) {
    const fileName = getSourceFileNameFromUrl(sourceUrl);

    location = (
      <div className={styles.PrimaryLabel}>
        ${fileName}:{lineNumber}
      </div>
    );
  }

  let codePreview: ReactNode | null = null;
  if (parsedTokens) {
    const html = parsedTokensToHtml(parsedTokens);

    codePreview = (
      <pre className={styles.SecondaryLabel} dangerouslySetInnerHTML={{ __html: html }} />
    );
  } else if (rawText) {
    codePreview = <pre className={styles.SecondaryLabel}>{rawText}</pre>;
  }

  return (
    <div className={styles.LabelGroup} onClick={onSelectSource} title="Show in the Editor">
      <div className={styles.Labels}>
        {location}
        {codePreview}
      </div>
      <Icon className={styles.Icon} type="chevron-right" />
    </div>
  );
}