import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const SavedRoutinesTab = ({ savedRoutines }) => {
  const navigate = useNavigate();
  const [selectedRoutines, setSelectedRoutines] = useState([]);

  const handleSelectRoutine = (id) => {
    setSelectedRoutines((prev) =>
      prev?.includes(id) ? prev?.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    console.log("Deleting routines:", selectedRoutines);
    setSelectedRoutines([]);
  };

  const handleShareRoutine = (routine) => {
    console.log("Sharing routine:", routine?.id);
    // Mock share functionality
  };

  const handleExportRoutine = (routine) => {
    console.log("Exporting routine:", routine?.id);
    // Mock export functionality
  };

  return (
    <div className="rounded-3xl space-y-4">
      {/* Controls */}
      {selectedRoutines?.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
          <span className="text-sm font-caption text-foreground">
            Đã chọn {selectedRoutines?.length} routine
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            iconName="Trash2"
            iconPosition="left"
          >
            Xóa
          </Button>
        </div>
      )}
      {/* Routines List */}
      <div className="space-y-4">
        {savedRoutines?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Star" size={24} className="text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-foreground mb-2">
              Chưa có routine đã lưu
            </h3>
            <p className="text-muted-foreground font-caption mb-4">
              Tạo routine đầu tiên từ việc phân tích sản phẩm
            </p>
            <Button
              variant="default"
              onClick={() => navigate("/product-upload-scanner")}
              iconName="Plus"
              iconPosition="left"
            >
              Bắt đầu quét sản phẩm
            </Button>
          </div>
        ) : (
          savedRoutines?.map((routine) => (
            <div
              key={routine?.id}
              className={`rounded-2xl glass-card p-6 transition-smooth hover:shadow-glow ${
                selectedRoutines?.includes(routine?.id)
                  ? "ring-2 ring-primary/50"
                  : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => handleSelectRoutine(routine?.id)}
                  className="mt-1 transition-smooth hover:scale-110"
                >
                  <Icon
                    name={
                      selectedRoutines?.includes(routine?.id)
                        ? "CheckSquare"
                        : "Square"
                    }
                    size={20}
                    className={
                      selectedRoutines?.includes(routine?.id)
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  />
                </button>

                <div className="flex-1">
                  {/* Routine Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground mb-1">
                        {routine?.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground font-caption">
                        <div className="flex items-center gap-1">
                          <Icon name="Calendar" size={14} />
                          <span>Tạo: {routine?.createdDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Clock" size={14} />
                          <span>Cập nhật: {routine?.lastUsed}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="BarChart3" size={14} />
                          <span>Sử dụng: {routine?.usageCount} lần</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-full text-xs font-caption font-medium ${
                        routine?.type === "complete"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      {routine?.type === "complete"
                        ? "Routine đầy đủ"
                        : "Routine tối giản"}
                    </div>
                  </div>

                  {/* Routine Steps Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Morning Routine */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="Sun" size={16} className="text-warning" />
                        <span className="font-caption font-medium text-foreground">
                          Routine sáng ({routine?.morningSteps?.length} bước)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {routine?.morningSteps
                          ?.slice(0, 3)
                          ?.map((step, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <div className="w-1.5 h-1.5 bg-warning rounded-full flex-shrink-0" />
                              <span className="truncate">{step}</span>
                            </div>
                          ))}
                        {routine?.morningSteps?.length > 3 && (
                          <div className="text-xs text-muted-foreground font-caption">
                            +{routine?.morningSteps?.length - 3} bước khác
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Evening Routine */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="Moon" size={16} className="text-primary" />
                        <span className="font-caption font-medium text-foreground">
                          Routine tối ({routine?.eveningSteps?.length} bước)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {routine?.eveningSteps
                          ?.slice(0, 3)
                          ?.map((step, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                              <span className="truncate">{step}</span>
                            </div>
                          ))}
                        {routine?.eveningSteps?.length > 3 && (
                          <div className="text-xs text-muted-foreground font-caption">
                            +{routine?.eveningSteps?.length - 3} bước khác
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate("/routine-recommendations", {
                            state: { routineData: routine },
                          })
                        }
                        iconName="Eye"
                        iconPosition="left"
                      >
                        Xem chi tiết
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareRoutine(routine)}
                        iconName="Share2"
                        iconPosition="left"
                      >
                        Chia sẻ
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportRoutine(routine)}
                        iconName="Download"
                        iconPosition="left"
                      >
                        Xuất PDF
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          console.log("Using routine:", routine?.id)
                        }
                        iconName="Play"
                        iconPosition="left"
                      >
                        Sử dụng
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SavedRoutinesTab;
