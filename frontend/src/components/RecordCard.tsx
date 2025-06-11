import React, { Fragment, useState } from 'react';
import { Record } from '../types';
import { getRecordKey } from '../utils/record';
import '../styles/components/RecordCard.css';

interface RecordCardProps {
    record: Record;
    isExpanded: Boolean;
    toggleExpand: (key: string) => void;
}

const RecordCard: React.FC<RecordCardProps> = ({ record, isExpanded, toggleExpand }) => {
    const key = getRecordKey(record)
    return (
        <div
            className={`record-card ${isExpanded ? 'expanded' : ''}`}
            onClick={() => toggleExpand(key)}
        >
            <div className="record-header">
                <span>
                <span className="record-type">{record.dnsRecord.type}</span>
                <span className="record-name">{record.dnsRecord.name}</span>
                </span>
                <span>
                <span className="arrow">→</span>
                <span className="record-value">{record.dnsRecord.value}</span>
                </span>
            </div>
            <div className="record-details">
                <table>
                <tbody>
                    <tr>
                    <td>Host</td>
                    <td>{record.metadata.hostname}</td>
                    </tr>
                    {isExpanded &&
                    <Fragment>
                    <tr>
                        <td>Container</td>
                        <td>{record.metadata.containerName}</td>
                    </tr>
                    <tr>
                        <td>Container ID</td>
                        <td>
                        <span className="truncate">{record.metadata.containerId}</span>
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
                    </Fragment>}
                </tbody>
                </table>
            </div>
        </div>
    );
}

export default RecordCard;
