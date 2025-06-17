import { SortCriterion } from '../../types';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import styles from './SortItem.module.scss';
import { SORT_LABELS } from '../../utils/sort';
import { GripVertical } from 'lucide-react';

interface SortItemProps {
  criterion: SortCriterion;
  index: number;
  onToggleDirection: (index: number) => void;
  onRemove: (index: number) => void;
}

export default function SortItem({ criterion, index, onToggleDirection, onRemove }: SortItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: criterion.key });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={styles.sortItem}
    >
        <div className={styles.handle} {...attributes} {...listeners}>
            <GripVertical size={16} />
        </div>
        <div className={styles.label} {...attributes} {...listeners}>{SORT_LABELS[criterion.key]}</div>
        <button
            className={styles.directionToggle}
            onClick={(e) => {
            e.stopPropagation();
            onToggleDirection(index);
            }}
        >
            {criterion.ascending ? '↑' : '↓'}
        </button>
        <div className={styles.actions}>
            <button onClick={() => onRemove(index)}>✕</button>
        </div>
    </div>
  );
}
