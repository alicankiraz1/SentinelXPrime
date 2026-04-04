function normalizeLiteralText(text) {
  return text.toLowerCase();
}

function normalizePhraseText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isMessageSource(source) {
  return source === "message" || source === "messages" || source === "turn_messages";
}

function getNormalizationMode(check) {
  if (check.normalization === undefined) {
    return "literal";
  }

  if (check.normalization === "literal" || check.normalization === "phrase") {
    return check.normalization;
  }

  throw new Error(`Unsupported check normalization: ${check.normalization}`);
}

export function evaluateCheck(check, sources) {
  const sourceText = check.source === "turn_messages"
    ? Number.isInteger(check.turn)
      ? sources.turn_messages_list?.[check.turn - 1] ?? ""
      : sources.turn_messages ?? ""
    : sources[check.source] ?? "";
  const usePhraseNormalization =
    getNormalizationMode(check) === "phrase" && isMessageSource(check.source);
  const normalize = usePhraseNormalization ? normalizePhraseText : normalizeLiteralText;
  const haystack = normalize(sourceText);
  const patterns = check.patterns.map((pattern) => normalize(pattern));
  let pass = false;
  const sourceLabel = check.source === "turn_messages" && Number.isInteger(check.turn)
    ? `turn_messages[${check.turn}]`
    : check.source;
  const hasPhraseWithoutNot = (haystackText, phrase) => {
    let searchStart = 0;
    while (searchStart < haystackText.length) {
      const phraseIndex = haystackText.indexOf(phrase, searchStart);
      if (phraseIndex === -1) {
        return false;
      }

      const leadingText = haystackText.slice(0, phraseIndex).trimEnd();
      const isNegatedByNot = /(^|[^a-z0-9_])not\s*$/.test(leadingText);
      if (!isNegatedByNot) {
        return true;
      }

      searchStart = phraseIndex + phrase.length;
    }

    return false;
  };

  if (check.mode === "includes_all") {
    pass = patterns.every((pattern) => haystack.includes(pattern));
  } else if (check.mode === "includes_any") {
    pass = patterns.some((pattern) => haystack.includes(pattern));
  } else if (check.mode === "excludes_all") {
    pass = patterns.every((pattern) => !haystack.includes(pattern));
  } else if (check.mode === "excludes_all_not_prefixed") {
    pass = patterns.every((pattern) => !hasPhraseWithoutNot(haystack, pattern));
  } else {
    throw new Error(`Unsupported check mode: ${check.mode}`);
  }

  return {
    id: check.id,
    pass,
    notes: pass
      ? `Check passed for ${sourceLabel}.`
      : `Check failed for ${sourceLabel}: ${check.mode} ${check.patterns.join(", ")}`,
  };
}
