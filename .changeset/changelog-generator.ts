import { NewChangesetWithCommit, ChangelogFunctions, ModCompWithPackage } from '@changesets/types';

const getReleaseLine = async (changeset: NewChangesetWithCommit) => {
  const [firstLine, ...futureLines] = changeset.summary.split('\n').map(l => l.trimEnd());

  let returnVal = `- ${changeset.commit ? `${changeset.commit.slice(0, 7)}: ` : ''}${firstLine}`;

  if (futureLines.length > 0) {
    returnVal += `\n${futureLines.map(l => `  ${l}`).join('\n')}`;
  }

  return returnVal;
};

// const getVersionLine = async () => {
//   const date = new Date().toISOString().split('T')[0];
//   return `## 555 – ${date}`;
// };

const getDependencyReleaseLine = async (
  changesets: NewChangesetWithCommit[],
  dependenciesUpdated: ModCompWithPackage[]
) => {
  if (dependenciesUpdated.length === 0) return '';

  const changesetLinks = changesets.map(
    changeset =>
      `- Updated dependencies${changeset.commit ? ` [${changeset.commit.slice(0, 7)}]` : ''}`
  );

  const updatedDependenciesList = dependenciesUpdated.map(
    dependency => `  - ${dependency.name}@${dependency.newVersion}`
  );

  return [...changesetLinks, ...updatedDependenciesList].join('\n');
};

const defaultChangelogFunctions: ChangelogFunctions = {
  getReleaseLine,
  getDependencyReleaseLine,
};

export default defaultChangelogFunctions;
