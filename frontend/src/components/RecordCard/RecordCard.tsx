import { Fragment } from 'react';
import { RecordEntry } from '../../types';
import { getRecordKey } from '../../utils/record';
import styles from './RecordCard.module.scss';

interface RecordCardProps {
  record: RecordEntry;
  isExpanded: boolean;
  toggleExpand: (key: string) => void;
}

export default function RecordCard({ record, isExpanded, toggleExpand }: RecordCardProps) {
  const key = getRecordKey(record);

  return (
    <div className={styles.card} onClick={() => toggleExpand(key)}>
      <div className={styles.header}>
        <span>
          <span className={styles.type}>{record.dnsRecord.type}</span>
          <span className={styles.name}>{record.dnsRecord.name}</span>
        </span>
        <span>
          <span className={styles.arrow}>→</span>
          <span className={styles.value}>{record.dnsRecord.value}</span>
        </span>
      </div>

      <div className={styles.details}>
        <table>
          <tbody>
            <tr>
              <td>Host</td>
              <td>{record.metadata.hostname}</td>
            </tr>
            {isExpanded && (
              <Fragment>
                <tr>
                  <td>Container</td>
                  <td>{record.metadata.containerName}</td>
                </tr>
                <tr>
                  <td>Container ID</td>
                  <td>
                    <span className={styles.truncate}>{record.metadata.containerId}</span>
                  </td>
                </tr>
                <tr>
                  <td>Created</td>
                  <td>{new Date(record.metadata.created).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Force</td>
                  <td>{record.metadata.force ? 'Yes' : 'No'}</td>
                </tr>
              </Fragment>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
