CLUSTER := bestcarprice
REGISTRY := k3d-$(CLUSTER)-registry
NAMESPACE := bestcarprice

.PHONY: dev clean

dev:
	-@k3d cluster create $(CLUSTER) -p "8080:80@loadbalancer" --registry-create $(REGISTRY):10000 --wait
	@kubectl create namespace $(NAMESPACE) 2>/dev/null || true
	-@kubectl create secret generic $(NAMESPACE)-secrets -n $(NAMESPACE) \
		--from-literal=DATABASE=postgresql://bestcarprice:bestcarprice@host.docker.internal:5432/bestcarprice \
		--from-literal=SECRET=SECRET \
		--from-literal=S3_ENDPOINT=http://host.docker.internal:3900 \
		--from-literal=S3_ACCESS_KEY=test \
		--from-literal=S3_SECRET_KEY=test \
		--from-literal=S3_BUCKET=bestcarprice-images \
		--from-literal=S3_REGION=garage
	@docker build --pull --no-cache -t $(REGISTRY):10000/fraguinha/bestcarprice-backend:latest src/backend
	@docker build --pull --no-cache -t $(REGISTRY):10000/fraguinha/bestcarprice-frontend:latest src/frontend
	@docker push $(REGISTRY):10000/fraguinha/bestcarprice-backend:latest
	@docker push $(REGISTRY):10000/fraguinha/bestcarprice-frontend:latest
	@helm upgrade --install $(CLUSTER) ./chart -n $(NAMESPACE) -f chart/values-local.yaml
	@kubectl rollout status deployment/backend -n $(NAMESPACE)
	@kubectl rollout status deployment/frontend -n $(NAMESPACE)
	@echo "Application available at http://localhost:8080"

clean:
	-@k3d cluster delete $(CLUSTER)
