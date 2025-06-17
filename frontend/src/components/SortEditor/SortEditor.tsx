import { DndContext, closestCenter, TouchSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, useEffect } from 'react';
import styles from './SortEditor.module.scss';
import { SortCriterion, SortState } from '../../types';
import { SORT_LABELS } from '../../utils/sort';
import SortItem from './SortItem';

interface SortEditorProps {
  sort: SortState;
  onChange: (next: SortState) => void;
  availableFields: SortCriterion['key'][];
}

export default function SortEditor({ sort, onChange, availableFields }: SortEditorProps) {
  const [newKey, setNewKey] = useState<SortCriterion['key']>(() => {
    const remaining = availableFields.filter(
      (field) => !sort.some((s) => s.key === field)
    );
    return remaining[0];
  });

  useEffect(() => {
    const remaining = availableFields.filter(
      (field) => !sort.some((s) => s.key === field)
    );
    if (!remaining.includes(newKey)) {
      setNewKey(remaining[0]);
    }
  }, [availableFields, sort]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      }
    }),
);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sort.findIndex((c) => c.key === active.id);
      const newIndex = sort.findIndex((c) => c.key === over.id);
      const reordered = arrayMove(sort, oldIndex, newIndex);
      onChange(reordered);
    }
  };

  const handleAdd = () => {
    if (!sort.some((s) => s.key === newKey)) {
      const updated = [...sort, { key: newKey, ascending: true }];
      onChange(updated);

      const next = availableFields.find((f) => !updated.some((s) => s.key === f));
      if (next) setNewKey(next);
    }
  };

  const handleToggle = (index: number) => {
    const updated = [...sort];
    updated[index] = { ...updated[index], ascending: !updated[index].ascending };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(sort.filter((_, i) => i !== index));
  };

  const remaining = availableFields.filter((field) => !sort.some((s) => s.key === field));

  return (
    <div className={styles.sortList}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sort.map((s) => s.key)} strategy={verticalListSortingStrategy}>
          {sort.map((criterion, index) => (
            <SortItem
              key={criterion.key}
              criterion={criterion}
              index={index}
              onToggleDirection={handleToggle}
              onRemove={handleRemove}
            />
          ))}
        </SortableContext>
      </DndContext>

      {remaining.length > 0 && (
        <div className={styles.addControl}>
          <select value={newKey} onChange={(e) => setNewKey(e.target.value as SortCriterion['key'])}>
            {remaining.map((field) => (
              <option key={field} value={field}>
                {SORT_LABELS[field]}
              </option>
            ))}
          </select>
          <button onClick={handleAdd}>+ Add</button>
        </div>
      )}
    </div>
  );
}
